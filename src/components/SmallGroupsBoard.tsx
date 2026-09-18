"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PersonRow, SmallGroupRow } from "@/lib/supabase-types";

type Dragging = { kind: "person"; id: string } | { kind: "group"; id: string } | null;

const UNASSIGNED = "__unassigned__";
const DROP_ATTR = "data-drop-id";

// Native HTML5 drag-and-drop (the `draggable` attribute) never fires on
// touch devices at all -- iOS/iPadOS Safari just ignores it -- so dragging
// here is built on the Pointer Events API instead, which unifies mouse,
// touch, and pen under one set of events.
//
// Tracking is done with window-level listeners added on pointerdown and
// removed on pointerup/cancel, rather than element.setPointerCapture --
// iOS Safari's pointer capture support has real gaps (a captured element
// can silently stop receiving move/up events once the finger travels off
// the small grip icon it started on, which is the whole point of a drag),
// so relying on it is exactly the kind of thing that "works on desktop,
// silently does nothing on an iPad" that this had to be rebuilt to avoid.
// Window listeners don't have that dependency.
//
// Each draggable thing is a small dedicated grip handle (touch-action:
// none, -webkit-touch-callout/-user-select disabled so iOS doesn't try to
// select text or show its callout menu) rather than the whole row/card, so
// a touch that starts on ordinary text still scrolls normally; only a
// touch that starts on a grip is treated as a drag.
const gripStyle: React.CSSProperties = {
  touchAction: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
};

function GripIcon({
  className = "",
  onPointerDown,
}: {
  className?: string;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <span
      aria-hidden
      onPointerDown={onPointerDown}
      style={gripStyle}
      className={`select-none ${className}`}
    >
      ⠿
    </span>
  );
}

export function SmallGroupsBoard({
  initialGroups,
  initialPeople,
}: {
  initialGroups: SmallGroupRow[];
  initialPeople: PersonRow[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [groups, setGroups] = useState(initialGroups);
  const [people, setPeople] = useState(initialPeople);
  const [dragging, setDragging] = useState<Dragging>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unassigned = people.filter((p) => !p.small_group_id);

  function setDragOver(id: string | null) {
    dragOverIdRef.current = id;
    setDragOverId(id);
  }

  function endDrag() {
    setDragging(null);
    setDragOver(null);
  }

  async function movePerson(personId: string, targetGroupId: string | null) {
    const person = people.find((p) => p.id === personId);
    if (!person || person.small_group_id === targetGroupId) return;

    setPeople((prev) =>
      prev.map((p) => (p.id === personId ? { ...p, small_group_id: targetGroupId } : p))
    );
    // A person who's moved off a group loses "leader" there if they held it.
    if (!targetGroupId) {
      setGroups((prev) =>
        prev.map((g) => (g.leader_id === personId ? { ...g, leader_id: null } : g))
      );
    }

    setErrorMessage(null);
    try {
      const { error } = await supabase
        .from("people")
        .update({ small_group_id: targetGroupId })
        .eq("id", personId);
      if (error) throw error;

      if (!targetGroupId) {
        const { error: leaderError } = await supabase
          .from("small_groups")
          .update({ leader_id: null })
          .eq("leader_id", personId);
        if (leaderError) throw leaderError;
      }
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't move that person.");
      router.refresh();
    }
  }

  async function reorderGroups(draggedId: string, targetId: string) {
    const fromIndex = groups.findIndex((g) => g.id === draggedId);
    const toIndex = groups.findIndex((g) => g.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const reordered = [...groups];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setGroups(reordered);

    setErrorMessage(null);
    try {
      const changed = reordered
        .map((group, index) => ({ group, index }))
        .filter(({ group, index }) => group.sort_order !== index);

      for (const { group, index } of changed) {
        const { error } = await supabase
          .from("small_groups")
          .update({ sort_order: index })
          .eq("id", group.id);
        if (error) throw error;
      }
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't reorder groups.");
      router.refresh();
    }
  }

  function handleDrop(dragged: Dragging, targetId: string | null) {
    if (!dragged || !targetId) return;

    if (dragged.kind === "person") {
      movePerson(dragged.id, targetId === UNASSIGNED ? null : targetId);
    } else if (dragged.kind === "group" && targetId !== UNASSIGNED) {
      reorderGroups(dragged.id, targetId);
    }
  }

  // Attached to window for the duration of a drag (see comment above on why
  // not setPointerCapture). Re-subscribes only when a drag starts/ends, not
  // on every move, so dragOverIdRef (not the dragOverId state) is what
  // handleUp reads -- it stays current without needing this effect to
  // re-run on every hovered card.
  useEffect(() => {
    if (!dragging) return;

    function handleMove(e: PointerEvent) {
      e.preventDefault();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const target = el?.closest(`[${DROP_ATTR}]`);
      setDragOver(target?.getAttribute(DROP_ATTR) ?? null);
    }

    function handleUp() {
      handleDrop(dragging, dragOverIdRef.current);
      endDrag();
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
  }, [dragging]);

  function startDrag(e: React.PointerEvent, payload: Dragging) {
    if (dragging) return; // ignore a second finger/pointer mid-drag
    e.preventDefault();
    setDragging(payload);
  }

  const cardClass = (id: string) =>
    `flex aspect-square flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-clay-900/5 transition-shadow ${
      dragOverId === id ? "ring-2 ring-terracotta" : ""
    }`;

  return (
    <div>
      {errorMessage && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          {errorMessage}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {/* The "shadow box" for everyone not yet placed in a group. Fixed
            square size, no drag handle of its own (it doesn't reorder) --
            just a drop target for people dragged out of a group. */}
        <div {...{ [DROP_ATTR]: UNASSIGNED }} className={`${cardClass(UNASSIGNED)} bg-cream-soft`}>
          <div className="flex shrink-0 items-center justify-between gap-2">
            <h2 className="truncate font-display text-sm text-clay-900">Not in a Group</h2>
            <span className="shrink-0 rounded-full bg-clay-900/8 px-2 py-0.5 text-xs font-medium text-clay-500">
              {unassigned.length}
            </span>
          </div>
          <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto text-sm text-clay-700">
            {unassigned.map((person) => (
              <li key={person.id} className="flex items-center gap-1.5 rounded px-1 py-0.5">
                <GripIcon
                  className="shrink-0 cursor-grab text-clay-400 active:cursor-grabbing"
                  onPointerDown={(e) => startDrag(e, { kind: "person", id: person.id })}
                />
                <span className="truncate">{person.full_name}</span>
              </li>
            ))}
            {unassigned.length === 0 && (
              <li className="text-clay-500">Everyone has a small group.</li>
            )}
          </ul>
        </div>

        {groups.map((group) => {
          const members = people.filter((p) => p.small_group_id === group.id);
          const leader = members.find((p) => p.id === group.leader_id);
          const meta = [group.frequency, group.location].filter(Boolean).join(" · ");

          return (
            <div key={group.id} {...{ [DROP_ATTR]: group.id }} className={cardClass(group.id)}>
              <div className="flex shrink-0 items-start gap-1.5">
                <GripIcon
                  className="mt-0.5 shrink-0 cursor-grab text-clay-400 active:cursor-grabbing"
                  onPointerDown={(e) => startDrag(e, { kind: "group", id: group.id })}
                />
                <h2 className="min-w-0 flex-1 truncate font-display text-sm text-clay-900">
                  {group.name}
                </h2>
                <span className="shrink-0 rounded-full bg-sage/15 px-2 py-0.5 text-xs font-medium text-sage-dark">
                  {members.length}
                </span>
              </div>

              <p className="mt-0.5 shrink-0 truncate text-xs font-semibold uppercase tracking-wide text-terracotta-dark">
                {leader ? leader.full_name : "No leader"}
              </p>
              {meta && <p className="shrink-0 truncate text-xs text-clay-500">{meta}</p>}

              <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto text-sm text-clay-700">
                {members.map((person) => (
                  <li key={person.id} className="flex items-center gap-1.5 rounded px-1 py-0.5">
                    <GripIcon
                      className="shrink-0 cursor-grab text-clay-400 active:cursor-grabbing"
                      onPointerDown={(e) => startDrag(e, { kind: "person", id: person.id })}
                    />
                    <span className="truncate">{person.full_name}</span>
                  </li>
                ))}
                {members.length === 0 && <li className="text-clay-500">No members yet.</li>}
              </ul>

              <Link
                href={`/small-groups/${group.id}`}
                className="mt-3 shrink-0 border-t border-clay-900/8 pt-3 text-sm font-medium text-terracotta-dark hover:underline"
              >
                Manage
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
