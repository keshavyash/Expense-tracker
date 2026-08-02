"use client";

import { useState, useTransition } from "react";
import type { Category } from "@/lib/database.types";
import { addCategory, deleteCategory } from "@/lib/actions";
import { Trash2 } from "lucide-react";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await addCategory(name);
        setName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't add that category.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this category? Existing expenses using it will keep it on record.")) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't delete that category.");
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Electricity"
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
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0"
          >
            <span className="text-sm">{c.name}</span>
            <div className="flex items-center gap-3">
              {c.is_default && (
                <span className="rounded-sm bg-paper px-1.5 py-0.5 text-[11px] text-ink-soft">
                  default
                </span>
              )}
              {!c.is_default && (
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={pending}
                  className="text-ink-soft transition-std hover:text-danger disabled:opacity-50"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
