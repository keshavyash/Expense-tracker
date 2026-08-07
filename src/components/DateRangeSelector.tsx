"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { firstOfMonthIST, firstOfYearIST, lastOfMonthIST, todayIST } from "@/lib/dates";

const PRESET_KEYS = ["this-month", "last-month", "last-3", "last-6", "this-year"] as const;

function presetRange(preset: string): { from: string; to: string } {
  const to = todayIST();
  switch (preset) {
    case "last-month":
      return { from: firstOfMonthIST(1), to: lastOfMonthIST(1) };
    case "last-3":
      return { from: firstOfMonthIST(2), to };
    case "last-6":
      return { from: firstOfMonthIST(5), to };
    case "this-year":
      return { from: firstOfYearIST(), to };
    case "this-month":
    default:
      return { from: firstOfMonthIST(0), to };
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
