import Link from "next/link";
import { ensureHouseholdMember, getExpenses, monthRange } from "@/lib/data";
import { BucketCard } from "@/components/BucketCard";
import { ExpenseRow } from "@/components/ExpenseRow";
import { formatMoney } from "@/lib/format";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const currentMember = await ensureHouseholdMember();
  if (!currentMember) redirect("/login");

  const { from, to } = monthRange();
  const monthExpenses = await getExpenses({ from, to });
  const recent = await getExpenses({ limit: 8 });

  const common = monthExpenses.filter((e) => e.expense_type === "common");
  const you = monthExpenses.filter(
    (e) => e.expense_type === "personal" && e.owner_id === currentMember.id
  );
  const other = monthExpenses.filter(
    (e) => e.expense_type === "personal" && e.owner_id !== currentMember.id
  );
  const otherName = other[0]?.owner?.name ?? "Spouse";

  const sum = (list: typeof monthExpenses) =>
    list.reduce((acc, e) => acc + Number(e.amount), 0);

  const monthLabel = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-ink-soft">{monthLabel}</p>
        </div>
        <p className="font-mono text-sm tabular text-ink-soft">
          Total: <span className="font-semibold text-ink">{formatMoney(sum(monthExpenses))}</span>
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BucketCard
          label="Common"
          total={sum(common)}
          count={common.length}
          variant="common"
          href="/expenses?type=common"
        />
        <BucketCard
          label="Personal (You)"
          total={sum(you)}
          count={you.length}
          variant="you"
          href={`/expenses?type=personal&owner=${currentMember.id}`}
        />
        <BucketCard
          label={`Personal (${otherName})`}
          total={sum(other)}
          count={other.length}
          variant="spouse"
          href="/expenses?type=personal"
        />
      </div>

      <div className="rounded-md border border-line bg-paper-raised">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 md:px-6">
          <h2 className="text-sm font-semibold">Recent</h2>
          <Link href="/expenses" className="text-xs text-common hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink-soft">
            No expenses yet — add your first one.
          </p>
        ) : (
          recent.map((e) => (
            <ExpenseRow key={e.id} expense={e} currentMemberId={currentMember.id} />
          ))
        )}
      </div>
    </div>
  );
}
