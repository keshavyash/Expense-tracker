"use client";

import { useState, useTransition } from "react";
import type { Vendor } from "@/lib/database.types";
import { addVendor, deleteVendor, renameVendor } from "@/lib/actions";
import { Trash2, Pencil, Check, X } from "lucide-react";

export function VendorManager({ vendors }: { vendors: Vendor[] }) {
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
        await addVendor(name);
        setName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't add that vendor.");
      }
    });
  }

  function startEditing(v: Vendor) {
    setEditingId(v.id);
    setEditValue(v.name);
  }

  function saveEdit(id: string) {
    if (!editValue.trim()) return;
    startTransition(async () => {
      try {
        await renameVendor(id, editValue);
        setEditingId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't rename that vendor.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this vendor? Existing expenses using it will keep it on record.")) return;
    startTransition(async () => {
      try {
        await deleteVendor(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't delete that vendor.");
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Swiggy"
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

      {vendors.length === 0 ? (
        <p className="rounded-md border border-line bg-paper-raised px-4 py-6 text-center text-sm text-ink-soft">
          No vendors yet — they&apos;ll also be added automatically the first time you type a new one
          on the expense form.
        </p>
      ) : (
        <div className="rounded-md border border-line bg-paper-raised">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 last:border-b-0"
            >
              {editingId === v.id ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(v.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 rounded-sm border border-ink bg-paper px-2 py-1 text-sm outline-none"
                  />
                  <button
                    onClick={() => saveEdit(v.id)}
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
                </>
              ) : (
                <>
                  <span className="text-sm">{v.name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => startEditing(v)}
                      disabled={pending}
                      className="text-ink-soft transition-std hover:text-ink disabled:opacity-50"
                      aria-label={`Rename ${v.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={pending}
                      className="text-ink-soft transition-std hover:text-danger disabled:opacity-50"
                      aria-label={`Delete ${v.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
