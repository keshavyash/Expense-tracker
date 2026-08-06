"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to = isoDate(now);
  switch (preset) {
    case "this-month":
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to };
    case "last-3":
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to };
    case "this-year":
      return { from: isoDate(new Date(now.getFullYear(), 0, 1)), to };
    case "all-time":
      return { from: "2000-01-01", to };
    case "last-6":
    default:
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth() - 5, 1)), to };
  }
}

export function DateRangeSelector({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  function navigate(newFrom: string, newTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", newFrom);
    params.set("to", newTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePreset(preset: string) {
    if (!preset) return;
    const range = presetRange(preset);
    setLocalFrom(range.from);
    setLocalTo(range.to);
    navigate(range.from, range.to);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        onChange={(e) => handlePreset(e.target.value)}
        defaultValue=""
        className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
      >
        <option value="" disabled>
          Quick range…
        </option>
        <option value="this-month">This month</option>
        <option value="last-3">Last 3 months</option>
        <option value="last-6">Last 6 months</option>
        <option value="this-year">This year</option>
        <option value="all-time">All time</option>
      </select>

      <input
        type="date"
        value={localFrom}
        onChange={(e) => setLocalFrom(e.target.value)}
        className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
      />
      <span className="text-xs text-ink-soft">to</span>
      <input
        type="date"
        value={localTo}
        onChange={(e) => setLocalTo(e.target.value)}
        className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
      />
      <button
        type="button"
        onClick={() => navigate(localFrom, localTo)}
        className="rounded-sm bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-std hover:opacity-90"
      >
        Apply
      </button>
    </div>
  );
}
