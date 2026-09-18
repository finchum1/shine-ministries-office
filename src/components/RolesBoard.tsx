"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LeadershipRoleRow } from "@/lib/supabase-types";

type RoleColor = "terracotta" | "sage" | "lavender" | null;

const ROLE_COLORS: { value: RoleColor; label: string; swatch: string }[] = [
  { value: null, label: "None", swatch: "bg-white ring-1 ring-clay-900/15" },
  { value: "terracotta", label: "Terracotta", swatch: "bg-terracotta" },
  { value: "sage", label: "Sage", swatch: "bg-sage" },
  { value: "lavender", label: "Lavender", swatch: "bg-lavender" },
];

function cardAccentClass(color: RoleColor) {
  switch (color) {
    case "terracotta":
      return "bg-terracotta/10 ring-terracotta/25";
    case "sage":
      return "bg-sage/10 ring-sage/25";
    case "lavender":
      return "bg-lavender/10 ring-lavender/25";
    default:
      return "bg-white ring-clay-900/5";
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// document.execCommand is deprecated but still works for basic formatting in
// every evergreen browser, and pulling in a full rich-text editor library
// for "bold/italic/underline/lists" would be a lot of new dependency weight
// for an internal admin tool. The contentEditable div below is uncontrolled
// (its DOM is the source of truth while editing); we only read its innerHTML
// back out at save time, and seed it via ref when the modal opens.
const TOOLBAR: { command: string; label: string; icon: string }[] = [
  { command: "bold", label: "Bold", icon: "B" },
  { command: "italic", label: "Italic", icon: "I" },
  { command: "underline", label: "Underline", icon: "U" },
  { command: "insertUnorderedList", label: "Bullet list", icon: "•" },
  { command: "insertOrderedList", label: "Numbered list", icon: "1." },
];

const DROP_ATTR = "data-drop-id";

// Same window-level Pointer Events drag as SmallGroupsBoard (see that file
// for the full rationale) -- native HTML5 draggable doesn't fire on touch,
// and setPointerCapture has real iOS Safari gaps, so this tracks the drag
// with window listeners added on pointerdown and removed on pointerup.
const gripStyle: React.CSSProperties = {
  touchAction: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
};

function GripIcon({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <span
      aria-hidden
      onPointerDown={onPointerDown}
      style={gripStyle}
      className="flex h-8 w-8 shrink-0 cursor-grab select-none items-center justify-center rounded-full text-base leading-none text-clay-400 transition-colors hover:bg-clay-900/5 active:cursor-grabbing active:text-clay-600"
    >
      ⠿
    </span>
  );
}

export function RolesBoard({ initialRoles }: { initialRoles: LeadershipRoleRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [roles, setRoles] = useState(initialRoles);
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [assignedName, setAssignedName] = useState("");
  const [color, setColor] = useState<RoleColor>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);
  const rolesRef = useRef(initialRoles);

  const editingRole = openId && openId !== "new" ? roles.find((r) => r.id === openId) : null;

  useEffect(() => {
    if (openId === null) return;
    setTitle(editingRole?.title ?? "");
    setAssignedName(editingRole?.assigned_name ?? "");
    setColor(editingRole?.color ?? null);
    setConfirmingDelete(false);
    setErrorMessage(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = editingRole?.description_html ?? "";
    }
    // Only re-seed when the modal opens for a (possibly different) role, not
    // on every keystroke -- editingRole itself would change identity as
    // `roles` updates during typing-adjacent saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  function exec(command: string) {
    editorRef.current?.focus();
    document.execCommand(command);
  }

  function updateRoles(next: LeadershipRoleRow[]) {
    rolesRef.current = next;
    setRoles(next);
  }

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Title is required.");
      return;
    }
    const descriptionHtml = editorRef.current?.innerHTML ?? "";
    const trimmedName = assignedName.trim() || null;

    setSaving(true);
    setErrorMessage(null);
    try {
      if (editingRole) {
        const { error } = await supabase
          .from("leadership_roles")
          .update({ title: trimmedTitle, assigned_name: trimmedName, description_html: descriptionHtml, color })
          .eq("id", editingRole.id);
        if (error) throw error;
        updateRoles(
          rolesRef.current.map((r) =>
            r.id === editingRole.id
              ? { ...r, title: trimmedTitle, assigned_name: trimmedName, description_html: descriptionHtml, color }
              : r
          )
        );
      } else {
        const nextSortOrder = roles.length ? Math.max(...roles.map((r) => r.sort_order)) + 1 : 0;
        const { data, error } = await supabase
          .from("leadership_roles")
          .insert({
            title: trimmedTitle,
            assigned_name: trimmedName,
            description_html: descriptionHtml,
            color,
            sort_order: nextSortOrder,
          })
          .select()
          .single();
        if (error) throw error;
        updateRoles([...rolesRef.current, data as LeadershipRoleRow]);
      }
      setOpenId(null);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't save that role.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingRole) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.from("leadership_roles").delete().eq("id", editingRole.id);
      if (error) throw error;
      updateRoles(rolesRef.current.filter((r) => r.id !== editingRole.id));
      setOpenId(null);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't delete that role.");
    } finally {
      setSaving(false);
    }
  }

  function setDragOver(id: string | null) {
    dragOverIdRef.current = id;
    setDragOverId(id);
  }

  // Moves the dragged card to swap places with whatever it's hovering,
  // live -- called on every pointermove during a drag so the grid re-flows
  // as you drag instead of jumping into place on release.
  function liveReorder(draggedId: string, targetId: string) {
    const current = rolesRef.current;
    const fromIndex = current.findIndex((r) => r.id === draggedId);
    const toIndex = current.findIndex((r) => r.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const reordered = [...current];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    updateRoles(reordered);
  }

  async function persistOrder() {
    setErrorMessage(null);
    try {
      const changed = rolesRef.current
        .map((role, index) => ({ role, index }))
        .filter(({ role, index }) => role.sort_order !== index);

      for (const { role, index } of changed) {
        const { error } = await supabase
          .from("leadership_roles")
          .update({ sort_order: index })
          .eq("id", role.id);
        if (error) throw error;
      }
      if (changed.length > 0) {
        updateRoles(rolesRef.current.map((r, index) => ({ ...r, sort_order: index })));
      }
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't reorder roles.");
      router.refresh();
    }
  }

  useEffect(() => {
    if (!draggingId) return;

    function handleMove(e: PointerEvent) {
      e.preventDefault();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const target = el?.closest(`[${DROP_ATTR}]`);
      const targetId = target?.getAttribute(DROP_ATTR) ?? null;
      setDragOver(targetId);

      if (draggingId && targetId && targetId !== draggingId) {
        liveReorder(draggingId, targetId);
      }
    }

    function handleUp() {
      persistOrder();
      setDraggingId(null);
      setDragOver(null);
    }

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId]);

  function startDrag(e: React.PointerEvent, id: string) {
    if (draggingId) return;
    e.preventDefault();
    setDraggingId(id);
  }

  return (
    <div>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => setOpenId("new")}
          className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-clay-900/15 p-5 text-clay-500 transition-colors hover:border-terracotta hover:text-terracotta-dark"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-sm font-medium">New Role</span>
        </button>

        {roles.map((role) => (
          <div
            key={role.id}
            {...{ [DROP_ATTR]: role.id }}
            className={`flex min-h-36 flex-col rounded-2xl p-3 shadow-sm ring-1 transition-shadow ${cardAccentClass(
              role.color
            )} ${dragOverId === role.id ? "ring-2 ring-terracotta" : ""}`}
          >
            <GripIcon onPointerDown={(e) => startDrag(e, role.id)} />
            <button
              type="button"
              onClick={() => setOpenId(role.id)}
              className="flex flex-1 flex-col items-start px-2 pb-2 pt-1 text-left"
            >
              <h2 className="font-display text-lg text-clay-900">{role.title}</h2>
              <p className="mt-0.5 text-xs text-clay-500">{role.assigned_name || "Unassigned"}</p>
              <p className="mt-2 line-clamp-4 text-sm text-clay-700">
                {role.description_html ? stripHtml(role.description_html) : "No description yet."}
              </p>
            </button>
          </div>
        ))}

        {roles.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-clay-500">
            No leadership roles yet — add the first one.
          </p>
        )}
      </div>

      {openId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-clay-900/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-clay-900/8 px-6 py-4">
              <h2 className="font-display text-lg text-clay-900">
                {editingRole ? "Edit Role" : "New Role"}
              </h2>
              <div className="flex items-center gap-4">
                {editingRole && (
                  <Link
                    href={`/roles/${editingRole.id}/print`}
                    target="_blank"
                    className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
                  >
                    Print
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-clay-500 transition-colors hover:bg-clay-900/5"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {errorMessage && (
                <p className="mb-4 rounded-xl bg-terracotta-light/30 p-3 text-sm text-terracotta-dark">
                  {errorMessage}
                </p>
              )}

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Role title"
                className="w-full border-b border-clay-900/12 pb-2 font-display text-xl text-clay-900 outline-none focus:border-terracotta"
              />
              <input
                value={assignedName}
                onChange={(e) => setAssignedName(e.target.value)}
                placeholder="Name"
                className="mt-2 w-full border-b border-clay-900/12 pb-1.5 text-sm text-clay-700 outline-none focus:border-terracotta"
              />

              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-clay-500">
                  Card color
                </span>
                <div className="flex items-center gap-2">
                  {ROLE_COLORS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      title={opt.label}
                      aria-label={opt.label}
                      onClick={() => setColor(opt.value)}
                      className={`h-7 w-7 rounded-full transition-shadow ${opt.swatch} ${
                        color === opt.value ? "ring-2 ring-offset-2 ring-clay-900/40" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1 rounded-lg bg-cream-soft p-1.5">
                {TOOLBAR.map((btn) => (
                  <button
                    key={btn.command}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => exec(btn.command)}
                    title={btn.label}
                    className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold text-clay-700 transition-colors hover:bg-white"
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="mt-2 min-h-56 rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm leading-relaxed text-clay-900 outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              />
            </div>

            <div className="flex items-center justify-between border-t border-clay-900/8 px-6 py-4">
              <div>
                {editingRole && !confirmingDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
                  >
                    Delete role
                  </button>
                )}
                {editingRole && confirmingDelete && (
                  <span className="flex items-center gap-3 text-sm">
                    <span className="text-terracotta-dark">Delete this role?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="font-semibold text-terracotta-dark hover:underline"
                    >
                      {saving ? "Deleting…" : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="text-clay-500 hover:text-clay-900"
                    >
                      Cancel
                    </button>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-clay-700 transition-colors hover:bg-clay-900/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-sage px-6 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
