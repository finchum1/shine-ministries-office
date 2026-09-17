"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PersonRow, SmallGroupRow } from "@/lib/supabase-types";
import { EditDeleteActions } from "@/components/EditDeleteActions";

type Dragging = { kind: "person"; id: string } | { kind: "group"; id: string } | null;

const UNASSIGNED = "__unassigned__";

export function SmallGroupsBoard({
  initialGroups,
  initialPeople,
  deleteSmallGroup,
}: {
  initialGroups: SmallGroupRow[];
  initialPeople: PersonRow[];
  deleteSmallGroup: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [groups, setGroups] = useState(initialGroups);
  const [people, setPeople] = useState(initialPeople);
  const [dragging, setDragging] = useState<Dragging>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unassigned = people.filter((p) => !p.small_group_id);

  function endDrag() {
    setDragging(null);
    setDragOverId(null);
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

  function handleDrop(targetId: string) {
    const dragged = dragging;
    endDrag();
    if (!dragged) return;

    if (dragged.kind === "person") {
      movePerson(dragged.id, targetId === UNASSIGNED ? null : targetId);
    } else if (dragged.kind === "group" && targetId !== UNASSIGNED) {
      reorderGroups(dragged.id, targetId);
    }
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
            square size, no drag handle (it doesn't reorder) -- just a drop
            target for people dragged out of a group. */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => dragging?.kind === "person" && setDragOverId(UNASSIGNED)}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(UNASSIGNED);
          }}
          className={`${cardClass(UNASSIGNED)} bg-cream-soft`}
        >
          <div className="flex shrink-0 items-center justify-between gap-2">
            <h2 className="truncate font-display text-sm text-clay-900">Not in a Group</h2>
            <span className="shrink-0 rounded-full bg-clay-900/8 px-2 py-0.5 text-xs font-medium text-clay-500">
              {unassigned.length}
            </span>
          </div>
          <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto text-sm text-clay-700">
            {unassigned.map((person) => (
              <li
                key={person.id}
                draggable
                onDragStart={() => setDragging({ kind: "person", id: person.id })}
                onDragEnd={endDrag}
                className="cursor-grab truncate rounded px-1 py-0.5 active:cursor-grabbing"
              >
                {person.full_name}
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
            <div
              key={group.id}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragOverId(group.id)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(group.id);
              }}
              className={cardClass(group.id)}
            >
              <div className="flex shrink-0 items-start gap-1.5">
                <span
                  draggable
                  onDragStart={() => setDragging({ kind: "group", id: group.id })}
                  onDragEnd={endDrag}
                  title="Drag to reorder"
                  className="mt-0.5 shrink-0 cursor-grab select-none text-clay-400 active:cursor-grabbing"
                >
                  ⠿
                </span>
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
                  <li
                    key={person.id}
                    draggable
                    onDragStart={() => setDragging({ kind: "person", id: person.id })}
                    onDragEnd={endDrag}
                    className="cursor-grab truncate rounded px-1 py-0.5 active:cursor-grabbing"
                  >
                    {person.full_name}
                  </li>
                ))}
                {members.length === 0 && <li className="text-clay-500">No members yet.</li>}
              </ul>

              <div className="shrink-0">
                <EditDeleteActions
                  editHref={`/small-groups/${group.id}`}
                  deleteAction={deleteSmallGroup.bind(null, group.id)}
                  itemLabel="small group"
                  variant="card"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
