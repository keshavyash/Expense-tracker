import { ensureHouseholdMember, getExpenses } from "@/lib/data";
import { CategoryBarChart, SplitPieChart, MonthlyTrendChart } from "@/components/Charts";
import { redirect } from "next/navigation";

function lastNMonths(n: number) {
  const months: { from: string; to: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    months.push({ from, to, label });
  }
  return months;
}

export default async function ReportsPage() {
  const months = lastNMonths(6);
  const [currentMember, rangeExpenses] = await Promise.all([
    ensureHouseholdMember(),
    getExpenses({ from: months[0].from, to: months[months.length - 1].to }),
  ]);
  if (!currentMember) redirect("/login");

  const byCategory = new Map<string, number>();
  for (const e of rangeExpenses) {
    const key = e.category?.name ?? "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + Number(e.amount));
  }
  const categoryData = Array.from(byCategory, ([name, total]) => ({ name, total })).sort(
    (a, b) => b.total - a.total
  );

  const common = rangeExpenses.filter((e) => e.expense_type === "common");
  const you = rangeExpenses.filter((e) => e.expense_type === "personal" && e.owner_id === currentMember.id);
  const other = rangeExpenses.filter((e) => e.expense_type === "personal" && e.owner_id !== currentMember.id);
  const otherName = other[0]?.owner?.name ?? "Spouse";
  const sum = (l: typeof rangeExpenses) => l.reduce((a, e) => a + Number(e.amount), 0);
  const splitData = [
    { name: "Common", value: sum(common) },
    { name: "Personal (You)", value: sum(you) },
    { name: `Personal (${otherName})`, value: sum(other) },
  ];

  const trendData = months.map((m) => ({
    month: m.label,
    total: rangeExpenses
      .filter((e) => e.expense_date >= m.from && e.expense_date <= m.to)
      .reduce((a, e) => a + Number(e.amount), 0),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Reports</h1>
      <p className="mb-6 text-sm text-ink-soft">Last 6 months</p>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-md border border-line bg-paper-raised p-5">
          <h2 className="mb-3 text-sm font-semibold">Personal vs common</h2>
          <SplitPieChart data={splitData} />
        </div>
        <div className="rounded-md border border-line bg-paper-raised p-5">
          <h2 className="mb-3 text-sm font-semibold">Monthly trend</h2>
          <MonthlyTrendChart data={trendData} />
        </div>
      </div>

      <div className="rounded-md border border-line bg-paper-raised p-5">
        <h2 className="mb-3 text-sm font-semibold">Spend by category</h2>
        <CategoryBarChart data={categoryData} />
      </div>
    </div>
  );
}
