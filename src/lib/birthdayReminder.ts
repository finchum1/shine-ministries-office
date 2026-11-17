import { createAdminClient } from "@/lib/supabase/admin";
import { daysUntilBirthday, formatBirthday } from "@/lib/birthday";

// Who gets the birthday reminder emails. Same inbox the website's contact form
// uses.
export const BIRTHDAY_REMINDER_TO = "brookefinchum@gmail.com";

// Email goes out through Resend's HTTP API (no SDK needed). The sender
// address is the same verified one the public site already uses.
const FROM = "Shine Ministries Office <hello@shineministriesok.com>";

export type UpcomingBirthday = {
  name: string;
  month: number;
  day: number;
  daysAway: number;
  turning: number | null; // age they turn, when the birth year is on file
};

export async function loadUpcomingBirthdays(
  todayIso: string,
  withinDays: number
): Promise<UpcomingBirthday[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("people")
    .select("full_name, birth_month, birth_day, birth_year")
    .not("birth_month", "is", null)
    .not("birth_day", "is", null);
  if (error) throw new Error(error.message);

  const [ty, tm, td] = todayIso.split("-").map(Number);
  const out: UpcomingBirthday[] = [];
  for (const p of data ?? []) {
    const b = { month: p.birth_month as number, day: p.birth_day as number, year: p.birth_year as number | null };
    const daysAway = daysUntilBirthday(b, todayIso);
    if (daysAway === null || daysAway > withinDays) continue;
    const occursInYear = new Date(Date.UTC(ty, tm - 1, td + daysAway)).getUTCFullYear();
    out.push({
      name: p.full_name as string,
      month: b.month,
      day: b.day,
      daysAway,
      turning: b.year ? occursInYear - b.year : null,
    });
  }
  return out.sort((a, b) => a.daysAway - b.daysAway || a.name.localeCompare(b.name));
}

function when(daysAway: number) {
  if (daysAway === 0) return "today";
  if (daysAway === 1) return "tomorrow";
  return `in ${daysAway} days`;
}

function line(p: UpcomingBirthday) {
  const date = formatBirthday({ month: p.month, day: p.day, year: null });
  return `${p.name} — ${date} (${when(p.daysAway)})${p.turning ? `, turning ${p.turning}` : ""}`;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildBirthdayEmail(items: UpcomingBirthday[], heading: string) {
  const today = items.filter((i) => i.daysAway === 0);
  const subject =
    today.length > 0
      ? `Birthday today: ${today.map((i) => i.name).join(", ")}`
      : `Birthdays coming up: ${items.map((i) => i.name).join(", ")}`;

  const text = [heading, "", ...items.map((i) => `• ${line(i)}`), "", "Shine Ministries Office"].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#2b2623;max-width:520px">
<p style="font-size:16px;margin:0 0 12px"><strong>${esc(heading)}</strong></p>
<ul style="padding-left:20px;margin:0 0 16px;line-height:1.7">${items.map((i) => `<li>${esc(line(i))}</li>`).join("")}</ul>
<p style="color:#8a8079;font-size:13px;margin:0">Shine Ministries Office</p></div>`;
  return { subject, text, html };
}

export async function sendEmail(email: { subject: string; text: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: "RESEND_API_KEY is not set on this project." };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: BIRTHDAY_REMINDER_TO, ...email }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false as const, error: `Email service said ${res.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true as const };
}
