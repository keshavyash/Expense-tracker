"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGroup } from "@/lib/actions";

export function GroupCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [othersInvolved, setOthersInvolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const id = await addGroup(name, othersInvolved);
        setName("");
        setOthersInvolved(false);
        router.push(`/groups/${id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't create that group.");
      }
    });
  }

  return (
    <form onSubmit={handleAdd}>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Goa trip, Dec 2026"
          className="flex-1 rounded-sm border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-common px-4 py-2 text-sm font-medium text-white transition-std hover:opacity-90 disabled:opacity-50"
        >
          Create
        </button>
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
        <input
          type="checkbox"
          checked={othersInvolved}
          onChange={(e) => setOthersInvolved(e.target.checked)}
          className="h-3.5 w-3.5 rounded-sm border-line accent-common"
        />
        Friends or other people outside the household will be involved (e.g. splitting costs
        with them)
      </label>
      {error && (
        <p className="mt-2 rounded-sm bg-spouse-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
    </form>
  );
}
