import Link from "next/link";
import { getGroupTotals, getGroups } from "@/lib/data";
import { GroupCreateForm } from "@/components/GroupCreateForm";
import { formatMoney } from "@/lib/format";

export default async function GroupsPage() {
  const [groups, totals] = await Promise.all([getGroups(), getGroupTotals()]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Groups</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Track a trip or event across several expenses — e.g. everything you spend on a 5-day
        tour. Defaults new expenses to Common, since group spends are usually shared.
      </p>

      <GroupCreateForm />

      {groups.length === 0 ? (
        <p className="mt-4 rounded-md border border-line bg-paper-raised px-4 py-8 text-center text-sm text-ink-soft">
          No groups yet — create one above.
        </p>
      ) : (
        <div className="mt-4 rounded-md border border-line bg-paper-raised">
          {groups.map((g) => {
            const t = totals[g.id] ?? { total: 0, count: 0 };
            return (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="flex items-center justify-between border-b border-line px-4 py-3 transition-std last:border-b-0 hover:bg-paper"
              >
                <div>
                  <p className="text-sm font-medium">{g.name}</p>
                  <p className="text-xs text-ink-soft">
                    {t.count} {t.count === 1 ? "expense" : "expenses"}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold tabular">
                  {formatMoney(t.total)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
