"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Category, Group, HouseholdMember } from "@/lib/database.types";
import { PAYMENT_METHOD_LABELS } from "@/lib/format";

export function FilterBar({
  categories,
  members,
  currentMemberId,
  groups,
}: {
  categories: Category[];
  members: HouseholdMember[];
  currentMemberId: string;
  groups: Group[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const type = searchParams.get("type") ?? "";
  const owner = searchParams.get("owner") ?? "";
  const category = searchParams.get("category") ?? "";
  const payment = searchParams.get("payment") ?? "";
  const group = searchParams.get("group") ?? "";
  const hasFilters = type || owner || category || payment || group;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper-raised px-4 py-3 md:px-6">
      <select
        value={type}
        onChange={(e) => setParam("type", e.target.value)}
        className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
      >
        <option value="">All types</option>
        <option value="common">Common</option>
        <option value="personal">Personal</option>
      </select>

      {type === "personal" && (
        <select
          value={owner}
          onChange={(e) => setParam("owner", e.target.value)}
          className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
        >
          <option value="">Anyone</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id === currentMemberId ? "You" : m.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={category}
        onChange={(e) => setParam("category", e.target.value)}
        className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={payment}
        onChange={(e) => setParam("payment", e.target.value)}
        className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
      >
        <option value="">All payment methods</option>
        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {groups.length > 0 && (
        <select
          value={group}
          onChange={(e) => setParam("group", e.target.value)}
          className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-ink"
        >
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          onClick={clearAll}
          className="ml-auto text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
