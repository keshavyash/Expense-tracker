import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureHouseholdMember, getExpenses } from "@/lib/data";
import { ExpenseRow } from "@/components/ExpenseRow";
import { GroupHeader } from "@/components/GroupHeader";
import { formatMoney } from "@/lib/format";
import type { Group } from "@/lib/database.types";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentMember = await ensureHouseholdMember();
  if (!currentMember) redirect("/login");

  const supabase = await createClient();
  const { data: group } = await supabase.from("groups").select("*").eq("id", id).single();
  if (!group) notFound();

  const expenses = await getExpenses({ groupId: id });
  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <GroupHeader group={group as Group} />

      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-sm tabular text-ink-soft">
          {expenses.length} {expenses.length === 1 ? "expense" : "expenses"} ·{" "}
          <span className="font-semibold text-ink">{formatMoney(total)}</span>
        </p>
        <Link
          href={`/expenses/new?group=${id}`}
          className="rounded-sm bg-common px-3 py-1.5 text-xs font-medium text-white transition-std hover:opacity-90"
        >
          Add expense to this group
        </Link>
      </div>

      <div className="rounded-md border border-line bg-paper-raised">
        {expenses.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-soft">
            No expenses in this group yet.
          </p>
        ) : (
          expenses.map((e) => (
            <ExpenseRow key={e.id} expense={e} currentMemberId={currentMember.id} />
          ))
        )}
      </div>
    </div>
  );
}
