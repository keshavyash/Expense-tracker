"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

function monthOptions(count = 12) {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
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
