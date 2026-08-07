"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { HouseholdMember } from "@/lib/database.types";

export function ReportTypeFilter({
  value,
  members,
}: {
  value: string;
  members: HouseholdMember[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", v);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
    >
      <option value="common">Common</option>
      {members.map((m) => (
        <option key={m.id} value={`personal:${m.id}`}>
          Personal ({m.name})
        </option>
      ))}
      <option value="personal">Personal (combined)</option>
      <option value="all">Common + Personal</option>
    </select>
  );
}
