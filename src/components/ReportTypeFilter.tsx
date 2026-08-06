"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function ReportTypeFilter({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set("type", v);
    else params.delete("type");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
    >
      <option value="">Common + Personal</option>
      <option value="common">Common only</option>
      <option value="personal">Personal only</option>
    </select>
  );
}
