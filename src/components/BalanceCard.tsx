import type { BalanceExpense } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { BalanceMonthSelector } from "@/components/BalanceMonthSelector";

// Net = (their personal expenses you paid) + (half of common expenses you paid)
//     − (half of common expenses they paid) − (your personal expenses they paid)
// Positive → they owe you. Negative → you owe them.
function computeNetOwedToMe(
  expenses: BalanceExpense[],
  currentMemberId: string,
  otherMemberId: string | undefined
): number {
  let net = 0;
  for (const e of expenses) {
    const amount = Number(e.amount);
    if (e.expense_type === "personal") {
      if (e.owner_id === otherMemberId && e.funded_by === currentMemberId) net += amount;
      if (e.owner_id === currentMemberId && e.funded_by === otherMemberId) net -= amount;
    } else if (e.expense_type === "common") {
      if (e.funded_by === currentMemberId) net += amount / 2;
      if (e.funded_by === otherMemberId) net -= amount / 2;
    }
  }
  return net;
}

export function BalanceCard({
  expenses,
  currentMemberId,
  otherMemberId,
  otherMemberName,
  monthValue,
}: {
  expenses: BalanceExpense[];
  currentMemberId: string;
  otherMemberId: string | undefined;
  otherMemberName: string;
  monthValue: string;
}) {
  const net = computeNetOwedToMe(expenses, currentMemberId, otherMemberId);
  const settled = Math.abs(net) < 0.5; // ignore sub-rupee rounding dust

  return (
    <div className="rounded-md border border-line bg-paper-raised p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Balance</h2>
        <BalanceMonthSelector value={monthValue} />
      </div>
      {settled ? (
        <p className="font-mono text-2xl font-semibold tabular tracking-tight text-ink-soft">
          All settled up
        </p>
      ) : net > 0 ? (
        <>
          <p className="font-mono text-2xl font-semibold tabular tracking-tight text-common">
            {formatMoney(net)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">{otherMemberName} owes you</p>
        </>
      ) : (
        <>
          <p className="font-mono text-2xl font-semibold tabular tracking-tight text-spouse">
            {formatMoney(Math.abs(net))}
          </p>
          <p className="mt-1 text-xs text-ink-soft">You owe {otherMemberName}</p>
        </>
      )}
      <p className="mt-3 text-xs text-ink-soft">
        Based on that month&apos;s expenses only — who paid personal spends for the other, and
        each person&apos;s share of common expenses they fronted.
      </p>
    </div>
  );
}
