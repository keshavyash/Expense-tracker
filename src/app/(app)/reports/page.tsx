import { Suspense } from "react";
import { ensureHouseholdMember, getExpenses, getHouseholdMembers } from "@/lib/data";
import { CategoryBarChart, SplitPieChart, MonthlyTrendChart } from "@/components/Charts";
import { BalanceCard } from "@/components/BalanceCard";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { ReportTypeFilter } from "@/components/ReportTypeFilter";
import { RankedList } from "@/components/RankedList";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { formatDate, PAYMENT_METHOD_LABELS } from "@/lib/format";
import { currentYearMonthIST, firstOfMonthIST, monthBounds, todayIST } from "@/lib/dates";
import { redirect } from "next/navigation";

function defaultReportRange(): { from: string; to: string } {
  return { from: firstOfMonthIST(0), to: todayIST() };
}

// Calendar-month buckets spanning [from, to], capped to the most recent
// 24 so a very wide custom range (or "All time") doesn't blow up the
// stacked trend chart into an unreadable strip.
function monthsBetween(fromISO: string, toISO: string, maxMonths = 24) {
  const [startY, startM] = fromISO.split("-").map(Number);
  const [endY, endM] = toISO.split("-").map(Number);
  const months: { from: string; to: string; label: string }[] = [];
  let y = startY;
  let m = startM;
  const { year: thisYear } = currentYearMonthIST();

  while (y < endY || (y === endY && m <= endM)) {
    const bounds = monthBounds(y, m);
    months.push({
      from: bounds.from,
      to: bounds.to,
      label: new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
        month: "short",
        year: y !== thisYear ? "2-digit" : undefined,
        timeZone: "UTC",
      }),
    });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return months.length > maxMonths ? months.slice(-maxMonths) : months;
}

// Parses a "YYYY-MM" selector value into a from/to date range for that month.
function monthParamToRange(param: string | undefined): { from: string; to: string; value: string } {
  const current = currentYearMonthIST();
  let year = current.year;
  let month = current.month;

  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    year = y;
    month = m;
  }

  const bounds = monthBounds(year, month);
  const value = `${year}-${String(month).padStart(2, "0")}`;
  return { from: bounds.from, to: bounds.to, value };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; from?: string; to?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const balanceRange = monthParamToRange(sp.month);
  const defaultRange = defaultReportRange();
  const reportFrom = sp.from || defaultRange.from;
  const reportTo = sp.to || defaultRange.to;
  const reportType = sp.type === "personal" ? "personal" : sp.type === "all" ? undefined : "common";
  const months = monthsBetween(reportFrom, reportTo);

  const [currentMember, rangeExpenses, balanceExpenses, members] = await Promise.all([
    ensureHouseholdMember(),
    getExpenses({ from: reportFrom, to: reportTo, expenseType: reportType }),
    getExpenses({ from: balanceRange.from, to: balanceRange.to }),
    getHouseholdMembers(),
  ]);
  if (!currentMember) redirect("/login");

  const otherMember = members.find((m) => m.id !== currentMember.id);

  const byCategory = new Map<string, number>();
  for (const e of rangeExpenses) {
    const key = e.category?.name ?? "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + Number(e.amount));
  }
  const categoryData = Array.from(byCategory, ([name, total]) => ({ name, total })).sort(
    (a, b) => b.total - a.total
  );
  const MAX_STACK_CATEGORIES = 7;
  const topCategoryNames = categoryData.slice(0, MAX_STACK_CATEGORIES).map((c) => c.name);
  const hasOther = categoryData.length > MAX_STACK_CATEGORIES;
  const trendCategoryNames = hasOther ? [...topCategoryNames, "Other"] : topCategoryNames;

  const common = rangeExpenses.filter((e) => e.expense_type === "common");
  const you = rangeExpenses.filter((e) => e.expense_type === "personal" && e.owner_id === currentMember.id);
  const other = rangeExpenses.filter((e) => e.expense_type === "personal" && e.owner_id !== currentMember.id);
  const otherName = otherMember?.name ?? other[0]?.owner?.name ?? "Spouse";
  const sum = (l: typeof rangeExpenses) => l.reduce((a, e) => a + Number(e.amount), 0);
  const splitData = [
    { name: "Common", value: sum(common) },
    { name: "Personal (You)", value: sum(you) },
    { name: `Personal (${otherName})`, value: sum(other) },
  ];

  const trendData = months.map((m) => {
    const row: Record<string, string | number> = { month: m.label };
    for (const name of trendCategoryNames) row[name] = 0;
    for (const e of rangeExpenses) {
      if (e.expense_date < m.from || e.expense_date > m.to) continue;
      const catName = e.category?.name ?? "Uncategorized";
      const key = topCategoryNames.includes(catName) ? catName : "Other";
      row[key] = (row[key] as number) + Number(e.amount);
    }
    return row;
  });

  // Top vendors
  const byVendor = new Map<string, { total: number; count: number }>();
  for (const e of rangeExpenses) {
    if (!e.vendor) continue;
    const bucket = byVendor.get(e.vendor.name) ?? { total: 0, count: 0 };
    bucket.total += Number(e.amount);
    bucket.count += 1;
    byVendor.set(e.vendor.name, bucket);
  }
  const topVendors = Array.from(byVendor, ([name, v]) => ({
    label: name,
    sublabel: `${v.count} ${v.count === 1 ? "expense" : "expenses"}`,
    amount: v.total,
  }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Biggest single expenses
  const biggestExpenses = [...rangeExpenses]
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 8)
    .map((e) => ({
      label: e.category?.name ?? "Uncategorized",
      sublabel: [formatDate(e.expense_date), e.vendor?.name, e.description]
        .filter(Boolean)
        .join(" · "),
      amount: Number(e.amount),
      href: `/expenses/${e.id}`,
    }));

  // Payment method breakdown
  const byPaymentMethod = new Map<string, number>();
  for (const e of rangeExpenses) {
    const label = PAYMENT_METHOD_LABELS[e.payment_method];
    byPaymentMethod.set(label, (byPaymentMethod.get(label) ?? 0) + Number(e.amount));
  }
  const paymentMethodData = Array.from(byPaymentMethod, ([name, value]) => ({ name, value }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Reports</h1>
        <ExportCsvButton
          expenses={rangeExpenses}
          filename={`expenses_${reportFrom}_to_${reportTo}.csv`}
        />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Suspense>
          <DateRangeSelector from={reportFrom} to={reportTo} />
        </Suspense>
        <Suspense>
          <ReportTypeFilter value={sp.type ?? "common"} />
        </Suspense>
      </div>

      <div className="mb-6">
        <Suspense>
          <BalanceCard
            expenses={balanceExpenses}
            currentMemberId={currentMember.id}
            otherMemberId={otherMember?.id}
            otherMemberName={otherName}
            monthValue={balanceRange.value}
          />
        </Suspense>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-md border border-line bg-paper-raised p-5">
          <h2 className="mb-3 text-sm font-semibold">Personal vs common</h2>
          <SplitPieChart data={splitData} />
        </div>
        <div className="rounded-md border border-line bg-paper-raised p-5">
          <h2 className="mb-3 text-sm font-semibold">Payment method breakdown</h2>
          <SplitPieChart data={paymentMethodData} />
        </div>
      </div>

      <div className="mb-6 rounded-md border border-line bg-paper-raised p-5">
        <h2 className="mb-3 text-sm font-semibold">Monthly trend by category</h2>
        <MonthlyTrendChart data={trendData} categories={trendCategoryNames} />
      </div>

      <div className="mb-6 rounded-md border border-line bg-paper-raised p-5">
        <h2 className="mb-3 text-sm font-semibold">Spend by category</h2>
        <CategoryBarChart data={categoryData} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-md border border-line bg-paper-raised p-5">
          <h2 className="mb-1 text-sm font-semibold">Top vendors</h2>
          <p className="mb-2 text-xs text-ink-soft">Where the money&apos;s actually going</p>
          <RankedList items={topVendors} />
        </div>
        <div className="rounded-md border border-line bg-paper-raised p-5">
          <h2 className="mb-1 text-sm font-semibold">Biggest expenses</h2>
          <p className="mb-2 text-xs text-ink-soft">Largest single spends in this period</p>
          <RankedList items={biggestExpenses} />
        </div>
      </div>
    </div>
  );
}
