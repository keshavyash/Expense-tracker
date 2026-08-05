import { Suspense } from "react";
import { ensureHouseholdMember, getCategories, getCurrentProfile, getExpenses, getHouseholdMembers } from "@/lib/data";
import { ExpenseRow } from "@/components/ExpenseRow";
import { FilterBar } from "@/components/FilterBar";
import { formatMoney } from "@/lib/format";
import { redirect } from "next/navigation";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const sp = await searchParams;
  const [categories, members, currentMember] = await Promise.all([
    getCategories(),
    getHouseholdMembers(),
    ensureHouseholdMember(),
  ]);

  const expenses = await getExpenses({
    expenseType: sp.type as "personal" | "common" | undefined,
    ownerId: sp.owner,
    categoryId: sp.category,
    paymentMethod: sp.payment,
  });

  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="mx-auto max-w-3xl md:px-8">
      <div className="flex items-center justify-between px-4 py-6 md:px-0">
        <h1 className="text-lg font-semibold tracking-tight">Expenses</h1>
        <p className="font-mono text-sm tabular text-ink-soft">
          {expenses.length} · <span className="font-semibold text-ink">{formatMoney(total)}</span>
        </p>
      </div>

      <div className="rounded-md border border-line bg-paper-raised md:mb-10">
        <Suspense>
          <FilterBar
            categories={categories}
            members={members}
            currentMemberId={currentMember?.id ?? ""}
          />
        </Suspense>
        {expenses.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-soft">
            No expenses match these filters.
          </p>
        ) : (
          expenses.map((e) => (
            <ExpenseRow key={e.id} expense={e} currentMemberId={currentMember?.id ?? ""} />
          ))
        )}
      </div>
    </div>
  );
}
