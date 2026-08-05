"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGroup } from "@/lib/actions";

export function GroupCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const id = await addGroup(name);
        setName("");
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
      {error && (
        <p className="mt-2 rounded-sm bg-spouse-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
    </form>
  );
}
