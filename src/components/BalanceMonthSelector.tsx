"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { currentYearMonthIST } from "@/lib/dates";

function monthOptions(count = 12) {
  const options: { value: string; label: string }[] = [];
  const { year: currentYear, month: currentMonth } = currentYearMonthIST();

  for (let i = 0; i < count; i++) {
    // currentMonth is 1-indexed; walk back i months using UTC arithmetic
    // so this matches server-side computation exactly (see lib/dates.ts).
    const d = new Date(Date.UTC(currentYear, currentMonth - 1 - i, 1));
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    options.push({ value, label });
  }
  return options;
}

export function BalanceMonthSelector({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const options = monthOptions();

  function handleChange(newValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newValue);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
