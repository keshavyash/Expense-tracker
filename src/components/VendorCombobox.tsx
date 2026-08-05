"use client";

import { useMemo, useRef, useState } from "react";
import type { Vendor } from "@/lib/database.types";

export function VendorCombobox({
  vendors,
  value,
  onChange,
}: {
  vendors: Vendor[];
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return vendors.slice(0, 8);
    return vendors.filter((v) => v.name.toLowerCase().includes(q)).slice(0, 8);
  }, [vendors, value]);

  const exactMatch = vendors.some((v) => v.name.toLowerCase() === value.trim().toLowerCase());

  function handleBlur() {
    // small delay so a click on a dropdown option registers before closing
    setTimeout(() => setOpen(false), 120);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="e.g. Swiggy, BigBasket, landlord's name…"
        className="w-full rounded-sm border border-line bg-paper-raised px-3 py-2 outline-none focus:border-ink"
        autoComplete="off"
      />
      {open && (filtered.length > 0 || value.trim()) && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-sm border border-line bg-paper-raised shadow-md">
          {filtered.map((v) => (
            <button
              key={v.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(v.name);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm transition-std hover:bg-paper"
            >
              {v.name}
            </button>
          ))}
          {value.trim() && !exactMatch && (
            <div className="border-t border-line px-3 py-2 text-xs text-ink-soft">
              Will add <span className="font-medium text-common">&quot;{value.trim()}&quot;</span> as a new vendor
            </div>
          )}
        </div>
      )}
    </div>
  );
}
