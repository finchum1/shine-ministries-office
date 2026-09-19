"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import type { PersonRow, SmallGroupRow } from "@/lib/supabase-types";
import { SunMark } from "@/components/icons/SunMark";
import { REORDER_SWAP_COOLDOWN_MS, REORDER_TRANSITION } from "@/lib/reorder-transition";

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
// touch that starts on a grip is treated as a drag. The handle itself is a
// generously padded 32px hit area (bigger than the icon drawn inside it)
// since a bare icon-sized target was too small to reliably grab on touch.
const gripStyle: React.CSSProperties = {
  touchAction: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
};

const gripBase =
  "flex h-8 w-8 shrink-0 cursor-grab select-none items-center justify-center rounded-full transition-colors hover:bg-clay-900/5 active:cursor-grabbing";

// People get a plain grip -- the sun mark is reserved for a group's own
// reorder handle, so the two kinds of drag read as visually distinct.
function PersonGrip({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <span
      aria-hidden
      onPointerDown={onPointerDown}
      style={gripStyle}
      className={`${gripBase} text-base leading-none text-clay-400 active:text-clay-600`}
    >
      ⠿
    </span>
  );
}

function GroupGrip({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <span
      aria-hidden
      onPointerDown={onPointerDown}
      style={gripStyle}
      className={`${gripBase} text-terracotta active:text-clay-900`}
      title="Drag to reorder"
    >
      <SunMark className="h-5 w-5" />
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
  const groupsRef = useRef(initialGroups);
  const lastReorderAtRef = useRef(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unassigned = people.filter((p) => !p.small_group_id);

  function updateGroups(next: SmallGroupRow[]) {
    groupsRef.current = next;
    setGroups(next);
  }

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
      updateGroups(
        groupsRef.current.map((g) => (g.leader_id === personId ? { ...g, leader_id: null } : g))
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

  // Moves the dragged group to swap places with whatever it's currently
  // hovering, live -- called on every pointermove while dragging a group,
  // not just on drop, so the grid re-flows as you drag instead of jumping
  // into place all at once at the end.
  function liveReorderGroups(draggedId: string, targetId: string) {
    const current = groupsRef.current;
    const fromIndex = current.findIndex((g) => g.id === draggedId);
    const toIndex = current.findIndex((g) => g.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const reordered = [...current];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    updateGroups(reordered);
  }

  // Writes whatever order groupsRef is currently in (already reordered live
  // during the drag) back to Supabase -- called once, on drop.
  async function persistGroupOrder() {
    setErrorMessage(null);
    try {
      const changed = groupsRef.current
        .map((group, index) => ({ group, index }))
        .filter(({ group, index }) => group.sort_order !== index);

      for (const { group, index } of changed) {
        const { error } = await supabase
          .from("small_groups")
          .update({ sort_order: index })
          .eq("id", group.id);
        if (error) throw error;
      }
      if (changed.length > 0) {
        updateGroups(groupsRef.current.map((g, index) => ({ ...g, sort_order: index })));
      }
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't reorder groups.");
      router.refresh();
    }
  }

  // Attached to window for the duration of a drag (see comment above on why
  // not setPointerCapture). Re-subscribes only when a drag starts/ends, not
  // on every move -- dragOverIdRef/groupsRef (not the state values) are what
  // handleMove/handleUp read, so they stay current without needing this
  // effect to re-run on every hovered card or live reorder.
  useEffect(() => {
    if (!dragging) return;

    function handleMove(e: PointerEvent) {
      e.preventDefault();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const target = el?.closest(`[${DROP_ATTR}]`);
      const targetId = target?.getAttribute(DROP_ATTR) ?? null;
      setDragOver(targetId);

      const now = performance.now();
      if (
        dragging?.kind === "group" &&
        targetId &&
        targetId !== UNASSIGNED &&
        targetId !== dragging.id &&
        now - lastReorderAtRef.current >= REORDER_SWAP_COOLDOWN_MS
      ) {
        liveReorderGroups(dragging.id, targetId);
        lastReorderAtRef.current = now;
      }
    }

    function handleUp() {
      if (dragging?.kind === "person") {
        movePerson(dragging.id, dragOverIdRef.current === UNASSIGNED ? null : dragOverIdRef.current);
      } else if (dragging?.kind === "group") {
        persistGroupOrder();
      }
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
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
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
                <PersonGrip onPointerDown={(e) => startDrag(e, { kind: "person", id: person.id })} />
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
            <motion.div
              key={group.id}
              layout
              transition={REORDER_TRANSITION}
              {...{ [DROP_ATTR]: group.id }}
              className={cardClass(group.id)}
            >
              <div className="flex shrink-0 items-center gap-1">
                <GroupGrip onPointerDown={(e) => startDrag(e, { kind: "group", id: group.id })} />
                <h2 className="min-w-0 flex-1 truncate font-display text-sm text-clay-900">
                  {group.name}
                </h2>
                <span className="shrink-0 rounded-full bg-sage/15 px-2 py-0.5 text-xs font-medium text-clay-900">
                  {members.length}
                </span>
              </div>

              <p className="mt-0.5 shrink-0 truncate text-xs font-semibold uppercase tracking-wide text-clay-900">
                {leader ? leader.full_name : "No leader"}
              </p>
              {meta && <p className="shrink-0 truncate text-xs text-clay-500">{meta}</p>}

              <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto text-sm text-clay-700">
                {members.map((person) => (
                  <li key={person.id} className="flex items-center gap-1.5 rounded px-1 py-0.5">
                    <PersonGrip
                      onPointerDown={(e) => startDrag(e, { kind: "person", id: person.id })}
                    />
                    <span className="truncate">{person.full_name}</span>
                  </li>
                ))}
                {members.length === 0 && <li className="text-clay-500">No members yet.</li>}
              </ul>

              <Link
                href={`/small-groups/${group.id}`}
                className="mt-3 shrink-0 border-t border-clay-900/8 pt-3 text-sm font-medium text-clay-900 hover:underline"
              >
                Manage
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
