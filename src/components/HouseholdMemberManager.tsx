"use client";

import { useState, useTransition } from "react";
import type { HouseholdMember } from "@/lib/database.types";
import { addHouseholdMember, renameHouseholdMember, setSodexoOwner } from "@/lib/actions";
import { Pencil, Check, X, Link2, UtensilsCrossed } from "lucide-react";

export function HouseholdMemberManager({
  members,
  currentMemberId,
}: {
  members: HouseholdMember[];
  currentMemberId: string;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await addHouseholdMember(name);
        setName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't add that person.");
      }
    });
  }

  function startEditing(m: HouseholdMember) {
    setEditingId(m.id);
    setEditValue(m.name);
  }

  function saveEdit(id: string) {
    if (!editValue.trim()) return;
    startTransition(async () => {
      try {
        await renameHouseholdMember(id, editValue);
        setEditingId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't rename that person.");
      }
    });
  }

  function handleSetSodexoOwner(id: string) {
    startTransition(async () => {
      try {
        await setSodexoOwner(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update the Sodexo owner.");
      }
    });
  }

  return (
    <div>
      <p className="mb-4 text-xs text-ink-soft">
        These are the people expenses can belong to. No login required — add a placeholder for
        anyone who doesn&apos;t have (or doesn&apos;t need) an account. If they sign in later, it
        links automatically.
      </p>

      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Priya"
          className="flex-1 rounded-sm border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-common px-4 py-2 text-sm font-medium text-white transition-std hover:opacity-90 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-sm bg-spouse-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="rounded-md border border-line bg-paper-raised">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0"
          >
            {editingId === m.id ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(m.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-sm border border-ink bg-paper px-2 py-1 text-sm outline-none"
                />
                <button
                  onClick={() => saveEdit(m.id)}
                  disabled={pending}
                  className="text-common transition-std hover:opacity-70 disabled:opacity-50"
                  aria-label="Save"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-ink-soft transition-std hover:text-ink"
                  aria-label="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">
                    {m.name}
                    {m.id === currentMemberId && (
                      <span className="ml-2 text-xs text-ink-soft">(you)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    {m.linked_user_id ? (
                      <span
                        className="flex items-center gap-1 rounded-sm bg-paper px-1.5 py-0.5 text-[11px] text-ink-soft"
                        title="This person has their own login"
                      >
                        <Link2 size={11} /> linked
                      </span>
                    ) : (
                      <span className="rounded-sm bg-paper px-1.5 py-0.5 text-[11px] text-ink-soft">
                        no login
                      </span>
                    )}
                    <button
                      onClick={() => startEditing(m)}
                      disabled={pending}
                      className="text-ink-soft transition-std hover:text-ink disabled:opacity-50"
                      aria-label={`Rename ${m.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
                {m.owns_sodexo ? (
                  <span className="flex w-fit items-center gap-1 rounded-sm bg-you-soft px-1.5 py-0.5 text-[11px] text-you">
                    <UtensilsCrossed size={11} /> Sodexo owner
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetSodexoOwner(m.id)}
                    disabled={pending}
                    className="w-fit text-[11px] text-ink-soft underline underline-offset-2 transition-std hover:text-ink disabled:opacity-50"
                  >
                    Set as Sodexo owner
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
