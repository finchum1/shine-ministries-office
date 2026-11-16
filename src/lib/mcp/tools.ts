import type { SupabaseClient } from "@supabase/supabase-js";

// The tools a connected bot can call. Principles:
//  * Bots see what staff see in the back office -- the same tables, nothing
//    more (no contact-form inbox, no auth data, no tokens).
//  * Writes are "safe writes": add or edit, never delete; new events are
//    drafts and published events are left alone, so nothing a bot does goes
//    live on the public website without a person publishing it; merch,
//    payments, brand assets and files are read-only.

type Args = Record<string, unknown>;
type Db = SupabaseClient;

export type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  write: boolean;
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint?: boolean };
  run: (db: Db, args: Args, ctx: { connectionName: string; canWrite: boolean }) => Promise<unknown>;
};

class ToolError extends Error {}

// ---- argument helpers -------------------------------------------------------

function optStr(args: Args, key: string, max = 500): string | null {
  const v = args[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") throw new ToolError(`${key} must be text.`);
  const t = v.trim();
  if (t.length > max) throw new ToolError(`${key} is too long (max ${max} characters).`);
  return t === "" ? null : t;
}

function reqStr(args: Args, key: string, max = 500): string {
  const v = optStr(args, key, max);
  if (!v) throw new ToolError(`${key} is required.`);
  return v;
}

function optInt(args: Args, key: string, fallback: number, min: number, max: number): number {
  const v = args[key];
  if (v === undefined || v === null) return fallback;
  if (typeof v !== "number" || !Number.isInteger(v)) throw new ToolError(`${key} must be a whole number.`);
  return Math.min(max, Math.max(min, v));
}

function optBool(args: Args, key: string, fallback: boolean): boolean {
  const v = args[key];
  if (v === undefined || v === null) return fallback;
  if (typeof v !== "boolean") throw new ToolError(`${key} must be true or false.`);
  return v;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reqId(args: Args, key: string): string {
  const v = reqStr(args, key, 64);
  if (!UUID.test(v)) throw new ToolError(`${key} must be an id from one of the list tools.`);
  return v;
}

function reqDate(args: Args, key: string): string {
  const v = reqStr(args, key, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) {
    throw new ToolError(`${key} must be a date like 2026-12-05.`);
  }
  return v;
}

function optUrl(args: Args, key: string): string | null {
  const v = optStr(args, key, 500);
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) throw new ToolError(`${key} must start with http:// or https://`);
  return v;
}

function optEmail(args: Args, key: string): string | null {
  const v = optStr(args, key, 200);
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ToolError(`${key} isn't a valid email address.`);
  return v.toLowerCase();
}

function todayCentral() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new ToolError(res.error.message);
  return (res.data ?? ([] as unknown)) as T;
}

const stripHtml = (html: string | null) =>
  (html ?? "")
    .replace(/<\/(p|li|h[1-6]|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const limitProp = (max: number, dflt: number) => ({
  type: "integer",
  description: `How many to return (default ${dflt}, max ${max}).`,
});

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false } as const;

// ---- read tools -------------------------------------------------------------

const readTools: Tool[] = [
  {
    name: "about_connection",
    title: "About this connection",
    description:
      "Says which connection you are using and whether it may make changes. Call this first if unsure what you are allowed to do.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    annotations: READ,
    run: async (_db, _args, ctx) => ({
      connection: ctx.connectionName,
      access: ctx.canWrite ? "read and safe writes" : "read only",
      today: todayCentral(),
      note: "Shine Ministries back office. Times are Central. Writes only add or edit; new events are saved as drafts for staff to publish.",
    }),
  },
  {
    name: "list_events",
    title: "List events",
    description:
      "Website events (Shine Gatherings, socials, etc.), soonest first. Includes drafts that are not on the public site yet (is_published false).",
    inputSchema: {
      type: "object",
      properties: {
        upcoming_only: { type: "boolean", description: "Only events today or later, plus date-TBD ones (default true)." },
        include_drafts: { type: "boolean", description: "Include unpublished drafts (default true)." },
        limit: limitProp(200, 50),
      },
    },
    write: false,
    annotations: READ,
    run: async (db, args) => {
      const upcoming = optBool(args, "upcoming_only", true);
      const drafts = optBool(args, "include_drafts", true);
      let q = db
        .from("events")
        .select("id, title, description, event_date, event_time, location, rsvp_url, date_tbd, is_published")
        .order("event_date", { ascending: true })
        .limit(optInt(args, "limit", 50, 1, 200));
      if (upcoming) q = q.or(`event_date.gte.${todayCentral()},date_tbd.eq.true`);
      if (!drafts) q = q.eq("is_published", true);
      return check(await q);
    },
  },
  {
    name: "list_bible_studies",
    title: "List Bible studies",
    description: "Bible studies on the website: day, time, location, leader, and whether each is active (shown publicly).",
    inputSchema: { type: "object", properties: {} },
    write: false,
    annotations: READ,
    run: async (db) =>
      check(
        await db
          .from("bible_studies")
          .select("id, title, description, day_of_week, meeting_time, location, leader_name, is_active")
          .order("sort_order")
      ),
  },
  {
    name: "list_serving_opportunities",
    title: "List serving opportunities",
    description: "Ways to serve listed on the website.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    annotations: READ,
    run: async (db) =>
      check(await db.from("serving_opportunities").select("id, title, description").order("sort_order")),
  },
  {
    name: "get_site_content",
    title: "Get website content settings",
    description:
      "The editable website text blocks (verse, founder bio, contact details, footer tagline, ...) as key/value JSON.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    annotations: READ,
    run: async (db) => check(await db.from("site_settings").select("key, value, updated_at").order("key")),
  },
  {
    name: "list_photos",
    title: "List website photos",
    description: "Photos used on the website (URLs and alt text). category is 'group' or 'founder'.",
    inputSchema: { type: "object", properties: { category: { type: "string", enum: ["group", "founder"] } } },
    write: false,
    annotations: READ,
    run: async (db, args) => {
      const category = optStr(args, "category", 20);
      let q = db.from("photos").select("id, category, url, alt_text").order("sort_order");
      if (category) q = q.eq("category", category);
      return check(await q);
    },
  },
  {
    name: "list_people",
    title: "List people",
    description:
      "The people directory (name, email, phone) with the small groups each person is in. Private member information: share only with the staff member you are working for.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Match part of a name or email." },
        limit: limitProp(500, 100),
      },
    },
    write: false,
    annotations: READ,
    run: async (db, args) => {
      const search = optStr(args, "search", 100);
      let q = db
        .from("people")
        .select("id, full_name, email, phone")
        .order("full_name")
        .limit(optInt(args, "limit", 100, 1, 500));
      if (search) {
        // Strip characters that have meaning inside a PostgREST filter string.
        const s = search.replace(/[,()*%\\]/g, " ").trim();
        if (s) q = q.or(`full_name.ilike.*${s}*,email.ilike.*${s}*`);
      }
      const people = check<{ id: string; full_name: string; email: string | null; phone: string | null }[]>(await q);
      if (people.length === 0) return [];

      const links = check<{ person_id: string; small_group_id: string }[]>(
        await db.from("person_small_groups").select("person_id, small_group_id").in("person_id", people.map((p) => p.id))
      );
      const groups = check<{ id: string; name: string }[]>(await db.from("small_groups").select("id, name"));
      const groupName = new Map(groups.map((g) => [g.id, g.name]));
      return people.map((p) => ({
        ...p,
        small_groups: links.filter((l) => l.person_id === p.id).map((l) => ({ id: l.small_group_id, name: groupName.get(l.small_group_id) ?? "" })),
      }));
    },
  },
  {
    name: "list_small_groups",
    title: "List small groups",
    description: "Small groups with schedule, leader and the names of their members.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    annotations: READ,
    run: async (db) => {
      const groups = check<
        { id: string; name: string; leader_id: string | null; meeting_day: string | null; meeting_time: string | null; location: string | null; frequency: string | null; notes: string | null }[]
      >(await db.from("small_groups").select("id, name, leader_id, meeting_day, meeting_time, location, frequency, notes").order("sort_order"));
      const people = check<{ id: string; full_name: string }[]>(await db.from("people").select("id, full_name"));
      const links = check<{ person_id: string; small_group_id: string }[]>(
        await db.from("person_small_groups").select("person_id, small_group_id")
      );
      const name = new Map(people.map((p) => [p.id, p.full_name]));
      return groups.map(({ leader_id, ...g }) => ({
        ...g,
        leader: leader_id ? { id: leader_id, name: name.get(leader_id) ?? null } : null,
        members: links
          .filter((l) => l.small_group_id === g.id)
          .map((l) => ({ id: l.person_id, name: name.get(l.person_id) ?? "" }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));
    },
  },
  {
    name: "get_attendance",
    title: "Get attendance headcounts",
    description:
      "Headcounts for past events (one number per event, no names), newest first. headcount is null when nobody has recorded it yet.",
    inputSchema: { type: "object", properties: { limit: limitProp(100, 30) } },
    write: false,
    annotations: READ,
    run: async (db, args) => {
      const rows = check<
        { id: string; title: string; event_date: string; event_attendance: { headcount: number } | { headcount: number }[] | null }[]
      >(
        await db
          .from("events")
          .select("id, title, event_date, event_attendance(headcount)")
          .eq("date_tbd", false)
          .lte("event_date", todayCentral())
          .order("event_date", { ascending: false })
          .limit(optInt(args, "limit", 30, 1, 100))
      );
      return rows.map((e) => {
        const a = Array.isArray(e.event_attendance) ? e.event_attendance[0] : e.event_attendance;
        return { event_id: e.id, title: e.title, event_date: e.event_date, headcount: a?.headcount ?? null };
      });
    },
  },
  {
    name: "list_merch_items",
    title: "List merch items",
    description: "Merch for sale (price, whether online orders are open, sizes).",
    inputSchema: { type: "object", properties: {} },
    write: false,
    annotations: READ,
    run: async (db) =>
      check(await db.from("merch_items").select("id, name, price, orders_open, has_sizes, description").order("sort_order")),
  },
  {
    name: "list_merch_orders",
    title: "List merch orders",
    description:
      "Merch orders grouped by buyer checkout, with each line, the total, and payment and pickup status. Contains buyer contact details. status: all, unpaid, or not_picked_up.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["all", "unpaid", "not_picked_up"], description: "Default all." },
        limit: limitProp(300, 100),
      },
    },
    write: false,
    annotations: READ,
    run: async (db, args) => {
      const status = optStr(args, "status", 20) ?? "all";
      if (!["all", "unpaid", "not_picked_up"].includes(status)) throw new ToolError("status must be all, unpaid or not_picked_up.");
      const items = check<{ id: string; name: string }[]>(await db.from("merch_items").select("id, name"));
      const itemName = new Map(items.map((i) => [i.id, i.name]));
      const rows = check<
        { id: string; item_id: string; buyer_name: string; buyer_email: string | null; buyer_phone: string | null; size: string | null; quantity: number; unit_price: number; paid: boolean; payment_method: string | null; picked_up: boolean; notes: string | null; source: string; checkout_id: string | null; created_at: string }[]
      >(await db.from("merch_orders").select("*").order("created_at", { ascending: false }).limit(1000));

      const groups = new Map<string, typeof rows>();
      for (const r of rows) {
        const key = r.checkout_id ?? r.id;
        groups.set(key, [...(groups.get(key) ?? []), r]);
      }
      let orders = [...groups.entries()].map(([id, lines]) => ({
        order_id: id,
        buyer_name: lines[0].buyer_name,
        buyer_email: lines.find((l) => l.buyer_email)?.buyer_email ?? null,
        buyer_phone: lines.find((l) => l.buyer_phone)?.buyer_phone ?? null,
        placed: lines[0].created_at,
        source: lines[0].source,
        lines: lines.map((l) => ({
          item: itemName.get(l.item_id) ?? "Item",
          size: l.size,
          quantity: l.quantity,
          unit_price: Number(l.unit_price),
          paid: l.paid,
          picked_up: l.picked_up,
        })),
        total: lines.reduce((s, l) => s + l.quantity * Number(l.unit_price), 0),
        amount_unpaid: lines.filter((l) => !l.paid).reduce((s, l) => s + l.quantity * Number(l.unit_price), 0),
        notes: lines.map((l) => l.notes).filter(Boolean),
      }));
      if (status === "unpaid") orders = orders.filter((o) => o.amount_unpaid > 0);
      if (status === "not_picked_up") orders = orders.filter((o) => o.lines.some((l) => !l.picked_up));
      return orders.slice(0, optInt(args, "limit", 100, 1, 300));
    },
  },
  {
    name: "list_leadership_roles",
    title: "List leadership roles",
    description: "Leadership roles, who is assigned, and a plain-text version of each role description.",
    inputSchema: { type: "object", properties: {} },
    write: false,
    annotations: READ,
    run: async (db) => {
      const rows = check<{ id: string; title: string; assigned_name: string | null; description_html: string | null }[]>(
        await db.from("leadership_roles").select("id, title, assigned_name, description_html").order("sort_order")
      );
      return rows.map(({ description_html, ...r }) => ({ ...r, description: stripHtml(description_html) }));
    },
  },
  {
    name: "list_files",
    title: "List files",
    description: "The back-office file library: folders and file names, sizes and types (names only, not the contents).",
    inputSchema: { type: "object", properties: {} },
    write: false,
    annotations: READ,
    run: async (db) => {
      const folders = check<{ id: string; name: string; parent_id: string | null }[]>(
        await db.from("file_folders").select("id, name, parent_id").order("sort_order")
      );
      const files = check<{ id: string; name: string; folder_id: string | null; size_bytes: number | null; content_type: string | null; created_at: string }[]>(
        await db.from("files").select("id, name, folder_id, size_bytes, content_type, created_at").order("sort_order").limit(500)
      );
      return { folders, files };
    },
  },
];

// ---- safe write tools -------------------------------------------------------

const writeTools: Tool[] = [
  {
    name: "create_event_draft",
    title: "Create an event draft",
    description:
      "Adds an event as an UNPUBLISHED draft. It will not appear on the public website until staff publish it in the back office. Dates are YYYY-MM-DD.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        event_date: { type: "string", description: "YYYY-MM-DD. If the date is not set yet, give a best guess and set date_tbd true." },
        date_tbd: { type: "boolean" },
        event_time: { type: "string", description: "Free text, e.g. '6:30 PM'." },
        location: { type: "string" },
        description: { type: "string" },
        rsvp_url: { type: "string" },
      },
      required: ["title", "event_date"],
    },
    write: true,
    annotations: WRITE,
    run: async (db, args) => {
      const row = {
        title: reqStr(args, "title", 200),
        event_date: reqDate(args, "event_date"),
        date_tbd: optBool(args, "date_tbd", false),
        event_time: optStr(args, "event_time", 50),
        location: optStr(args, "location", 200),
        description: optStr(args, "description", 4000),
        rsvp_url: optUrl(args, "rsvp_url"),
        is_published: false,
      };
      const created = check<{ id: string }>(await db.from("events").insert(row).select("id").single());
      return { created: true, id: created.id, is_published: false, note: "Saved as a draft. Staff publish it from Website > Events." };
    },
  },
  {
    name: "update_event_draft",
    title: "Edit an event draft",
    description:
      "Changes fields on an event that is still an unpublished draft. Published events cannot be changed from here (staff edit those) and publishing is not possible from here.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        event_date: { type: "string" },
        date_tbd: { type: "boolean" },
        event_time: { type: "string" },
        location: { type: "string" },
        description: { type: "string" },
        rsvp_url: { type: "string" },
      },
      required: ["id"],
    },
    write: true,
    annotations: { ...WRITE, idempotentHint: true },
    run: async (db, args) => {
      const id = reqId(args, "id");
      const existing = check<{ is_published: boolean }[]>(await db.from("events").select("is_published").eq("id", id));
      if (existing.length === 0) throw new ToolError("No event with that id.");
      if (existing[0].is_published) throw new ToolError("That event is published, so it can only be edited by staff in the back office.");

      const patch: Record<string, unknown> = {};
      if ("title" in args) patch.title = reqStr(args, "title", 200);
      if ("event_date" in args) patch.event_date = reqDate(args, "event_date");
      if ("date_tbd" in args) patch.date_tbd = optBool(args, "date_tbd", false);
      if ("event_time" in args) patch.event_time = optStr(args, "event_time", 50);
      if ("location" in args) patch.location = optStr(args, "location", 200);
      if ("description" in args) patch.description = optStr(args, "description", 4000);
      if ("rsvp_url" in args) patch.rsvp_url = optUrl(args, "rsvp_url");
      if (Object.keys(patch).length === 0) throw new ToolError("Nothing to change -- give at least one field.");

      // is_published = false in the filter guards against a staff member
      // publishing the draft between the check above and this update.
      const res = check<{ id: string }[]>(await db.from("events").update(patch).eq("id", id).eq("is_published", false).select("id"));
      if (res.length === 0) throw new ToolError("That event was just published, so it was not changed.");
      return { updated: true, id, changed: Object.keys(patch) };
    },
  },
  {
    name: "add_person",
    title: "Add a person",
    description: "Adds someone to the people directory. Fails if that email is already there.",
    inputSchema: {
      type: "object",
      properties: { full_name: { type: "string" }, email: { type: "string" }, phone: { type: "string" } },
      required: ["full_name"],
    },
    write: true,
    annotations: WRITE,
    run: async (db, args) => {
      const email = optEmail(args, "email");
      if (email) {
        const dup = check<{ id: string; full_name: string }[]>(await db.from("people").select("id, full_name").ilike("email", email));
        if (dup.length > 0) throw new ToolError(`${dup[0].full_name} (id ${dup[0].id}) already has that email. Use update_person instead.`);
      }
      const created = check<{ id: string }>(
        await db.from("people").insert({ full_name: reqStr(args, "full_name", 200), email, phone: optStr(args, "phone", 50) }).select("id").single()
      );
      return { created: true, id: created.id };
    },
  },
  {
    name: "update_person",
    title: "Edit a person",
    description: "Changes a person's name, email or phone. Only the fields you give are changed. Pass an empty string to clear an email or phone.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, full_name: { type: "string" }, email: { type: "string" }, phone: { type: "string" } },
      required: ["id"],
    },
    write: true,
    annotations: { ...WRITE, idempotentHint: true },
    run: async (db, args) => {
      const id = reqId(args, "id");
      const patch: Record<string, unknown> = {};
      if ("full_name" in args) patch.full_name = reqStr(args, "full_name", 200);
      if ("email" in args) patch.email = optEmail(args, "email");
      if ("phone" in args) patch.phone = optStr(args, "phone", 50);
      if (Object.keys(patch).length === 0) throw new ToolError("Nothing to change -- give at least one field.");
      const res = check<{ id: string }[]>(await db.from("people").update(patch).eq("id", id).select("id"));
      if (res.length === 0) throw new ToolError("No person with that id.");
      return { updated: true, id, changed: Object.keys(patch) };
    },
  },
  {
    name: "add_person_to_small_group",
    title: "Add a person to a small group",
    description: "Puts an existing person in an existing small group (ids from list_people and list_small_groups). Removing people is not possible from here.",
    inputSchema: {
      type: "object",
      properties: { person_id: { type: "string" }, small_group_id: { type: "string" } },
      required: ["person_id", "small_group_id"],
    },
    write: true,
    annotations: { ...WRITE, idempotentHint: true },
    run: async (db, args) => {
      const person_id = reqId(args, "person_id");
      const small_group_id = reqId(args, "small_group_id");
      const person = check<{ full_name: string }[]>(await db.from("people").select("full_name").eq("id", person_id));
      const group = check<{ name: string }[]>(await db.from("small_groups").select("name").eq("id", small_group_id));
      if (person.length === 0) throw new ToolError("No person with that id.");
      if (group.length === 0) throw new ToolError("No small group with that id.");
      check(await db.from("person_small_groups").upsert({ person_id, small_group_id }, { onConflict: "person_id,small_group_id", ignoreDuplicates: true }));
      return { added: true, person: person[0].full_name, small_group: group[0].name };
    },
  },
  {
    name: "record_attendance",
    title: "Record a headcount",
    description: "Sets how many people came to an event (a single number, no names). Replaces any earlier headcount for that event.",
    inputSchema: {
      type: "object",
      properties: { event_id: { type: "string" }, headcount: { type: "integer", minimum: 0 } },
      required: ["event_id", "headcount"],
    },
    write: true,
    annotations: { ...WRITE, idempotentHint: true },
    run: async (db, args) => {
      const event_id = reqId(args, "event_id");
      const headcount = args.headcount;
      if (typeof headcount !== "number" || !Number.isInteger(headcount) || headcount < 0 || headcount > 100000) {
        throw new ToolError("headcount must be a whole number, 0 or more.");
      }
      const ev = check<{ title: string }[]>(await db.from("events").select("title").eq("id", event_id));
      if (ev.length === 0) throw new ToolError("No event with that id.");
      check(await db.from("event_attendance").upsert({ event_id, headcount, updated_at: new Date().toISOString() }, { onConflict: "event_id" }));
      return { recorded: true, event: ev[0].title, headcount };
    },
  },
];

export const TOOLS: Tool[] = [...readTools, ...writeTools];
export { ToolError };
