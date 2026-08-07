"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExpenseWithRelations } from "@/lib/database.types";
import { formatMoney, formatDate } from "@/lib/format";
import { BalanceMonthSelector } from "@/components/BalanceMonthSelector";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Contribution {
  expense: ExpenseWithRelations;
  signedAmount: number; // positive = counts toward "they owe you"
  note: string;
}

// Net = (their personal expenses you paid) + (half of common expenses you paid)
//     − (half of common expenses they paid) − (your personal expenses they paid)
// Positive → they owe you. Negative → you owe them.
function computeBalance(
  expenses: ExpenseWithRelations[],
  currentMemberId: string,
  otherMemberId: string | undefined,
  otherMemberName: string
): { net: number; contributions: Contribution[] } {
  let net = 0;
  const contributions: Contribution[] = [];

  for (const e of expenses) {
    const amount = Number(e.amount);
    if (e.expense_type === "personal") {
      if (e.owner_id === otherMemberId && e.funded_by === currentMemberId) {
        net += amount;
        contributions.push({
          expense: e,
          signedAmount: amount,
          note: `${otherMemberName}'s personal expense — you paid`,
        });
      }
      if (e.owner_id === currentMemberId && e.funded_by === otherMemberId) {
        net -= amount;
        contributions.push({
          expense: e,
          signedAmount: -amount,
          note: `Your personal expense — ${otherMemberName} paid`,
        });
      }
    } else if (e.expense_type === "common") {
      const hasSplit = e.splits && e.splits.length > 0;

      if (hasSplit) {
        // A custom split overrides the default 50/50 assumption — use
        // the actual recorded share for whichever of you didn't pay.
        const yourShare =
          e.splits.find((s) => s.party_type === "member" && s.member_id === currentMemberId)
            ?.share_amount ?? 0;
        const otherShare =
          e.splits.find((s) => s.party_type === "member" && s.member_id === otherMemberId)
            ?.share_amount ?? 0;

        if (e.funded_by === currentMemberId && Number(otherShare) > 0) {
          net += Number(otherShare);
          contributions.push({
            expense: e,
            signedAmount: Number(otherShare),
            note: "Common expense (split) — you paid, their share",
          });
        }
        if (e.funded_by === otherMemberId && Number(yourShare) > 0) {
          net -= Number(yourShare);
          contributions.push({
            expense: e,
            signedAmount: -Number(yourShare),
            note: "Common expense (split) — they paid, your share",
          });
        }
      } else {
        if (e.funded_by === currentMemberId) {
          net += amount / 2;
          contributions.push({
            expense: e,
            signedAmount: amount / 2,
            note: "Common expense — you paid (your half counted)",
          });
        }
        if (e.funded_by === otherMemberId) {
          net -= amount / 2;
          contributions.push({
            expense: e,
            signedAmount: -amount / 2,
            note: `Common expense — ${otherMemberName} paid (their half counted)`,
          });
        }
      }
    }
  }

  contributions.sort((a, b) => b.expense.expense_date.localeCompare(a.expense.expense_date));
  return { net, contributions };
}

export function BalanceCard({
  expenses,
  currentMemberId,
  otherMemberId,
  otherMemberName,
  monthValue,
}: {
  expenses: ExpenseWithRelations[];
  currentMemberId: string;
  otherMemberId: string | undefined;
  otherMemberName: string;
  monthValue: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { net, contributions } = computeBalance(
    expenses,
    currentMemberId,
    otherMemberId,
    otherMemberName
  );
  const settled = Math.abs(net) < 0.5; // ignore sub-rupee rounding dust

  return (
    <div className="rounded-md border border-line bg-paper-raised p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Balance</h2>
        <BalanceMonthSelector value={monthValue} />
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        disabled={contributions.length === 0}
        className="flex w-full items-center justify-between gap-2 py-1 text-left disabled:cursor-default"
      >
        <div>
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
        </div>
        {contributions.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-ink-soft">
            {contributions.length} {contributions.length === 1 ? "entry" : "entries"}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-3 divide-y divide-line border-t border-line pt-1">
          {contributions.map((c) => (
            <Link
              key={c.expense.id}
              href={`/expenses/${c.expense.id}`}
              className="-mx-1 flex items-center justify-between gap-3 rounded-sm px-1 py-2 transition-std hover:bg-paper"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {c.expense.category?.name ?? "Uncategorized"}
                  {c.expense.vendor ? ` · ${c.expense.vendor.name}` : ""}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {formatDate(c.expense.expense_date)} · {c.note}
                </p>
              </div>
              <span
                className={`shrink-0 font-mono text-sm tabular ${
                  c.signedAmount >= 0 ? "text-common" : "text-spouse"
                }`}
              >
                {c.signedAmount >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(c.signedAmount))}
              </span>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-ink-soft">
        Based on that month&apos;s expenses only — who paid personal spends for the other, and
        each person&apos;s share of common expenses they fronted.
        {contributions.length > 0 && !expanded && " Tap the amount to see which expenses count."}
      </p>
    </div>
  );
}
