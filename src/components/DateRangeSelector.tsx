"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const PRESET_KEYS = ["this-month", "last-month", "last-3", "last-6", "this-year"] as const;

function presetRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to = isoDate(now);
  switch (preset) {
    case "last-month": {
      const from = isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const monthEnd = isoDate(new Date(now.getFullYear(), now.getMonth(), 0));
      return { from, to: monthEnd };
    }
    case "last-3":
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to };
    case "last-6":
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth() - 5, 1)), to };
    case "this-year":
      return { from: isoDate(new Date(now.getFullYear(), 0, 1)), to };
    case "this-month":
    default:
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to };
  }
}

function detectPreset(from: string, to: string): string {
  for (const key of PRESET_KEYS) {
    const r = presetRange(key);
    if (r.from === from && r.to === to) return key;
  }
  return "custom";
}

export function DateRangeSelector({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [preset, setPreset] = useState(() => detectPreset(from, to));
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  function navigate(newFrom: string, newTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", newFrom);
    params.set("to", newTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePresetChange(value: string) {
    setPreset(value);
    if (value === "custom") return; // wait for Apply
    const range = presetRange(value);
    navigate(range.from, range.to);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value)}
        className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
      >
        <option value="this-month">This month</option>
        <option value="last-month">Last month</option>
        <option value="last-3">Last 3 months</option>
        <option value="last-6">Last 6 months</option>
        <option value="this-year">This year</option>
        <option value="custom">Custom range…</option>
      </select>

      {preset === "custom" && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
          />
          <span className="text-xs text-ink-soft">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={() => navigate(customFrom, customTo)}
            className="rounded-sm bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-std hover:opacity-90"
          >
            Apply
          </button>
        </>
      )}
    </div>
  );
}
