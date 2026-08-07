"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Group } from "@/lib/database.types";
import { deleteGroup, renameGroup, setGroupOthersInvolved } from "@/lib/actions";
import { Pencil, Check, X, Trash2 } from "lucide-react";

export function GroupHeader({ group }: { group: Group }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [error, setError] = useState<string | null>(null);

  function saveEdit() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await renameGroup(group.id, name);
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't rename that group.");
      }
    });
  }

  function toggleOthersInvolved(checked: boolean) {
    startTransition(async () => {
      try {
        await setGroupOthersInvolved(group.id, checked);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update that setting.");
      }
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "Delete this group? Its expenses will stay, just no longer grouped together."
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteGroup(group.id);
        router.push("/groups");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't delete that group.");
      }
    });
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="flex-1 rounded-sm border border-ink bg-paper px-2 py-1 text-lg font-semibold outline-none"
            />
            <button
              onClick={saveEdit}
              disabled={pending}
              className="text-common transition-std hover:opacity-70 disabled:opacity-50"
              aria-label="Save"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setName(group.name);
              }}
              className="text-ink-soft transition-std hover:text-ink"
              aria-label="Cancel"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold tracking-tight">{group.name}</h1>
            <button
              onClick={() => setEditing(true)}
              className="text-ink-soft transition-std hover:text-ink"
              aria-label="Rename group"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              disabled={pending}
              className="ml-auto text-ink-soft transition-std hover:text-danger disabled:opacity-50"
              aria-label="Delete group"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
      {error && (
        <p className="mt-2 rounded-sm bg-spouse-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
        <input
          type="checkbox"
          checked={group.others_involved}
          disabled={pending}
          onChange={(e) => toggleOthersInvolved(e.target.checked)}
          className="h-3.5 w-3.5 rounded-sm border-line accent-common"
        />
        Friends or other people outside the household are involved in this group
      </label>
    </div>
  );
}
