"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExpenseWithRelations } from "@/lib/database.types";
import { formatMoney, formatDate } from "@/lib/format";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Contribution {
  expense: ExpenseWithRelations;
  signedAmount: number; // positive = Others owe more; negative = you/Anubha owe Others
  note: string;
}

function computeOthersBalance(expenses: ExpenseWithRelations[]): {
  net: number;
  contributions: Contribution[];
} {
  let net = 0;
  const contributions: Contribution[] = [];

  for (const e of expenses) {
    const othersSplit = e.splits.find((s) => s.party_type === "others");
    if (!othersSplit) continue;
    const othersAmount = Number(othersSplit.share_amount);
    if (othersAmount <= 0) continue;

    if (e.paid_by_others) {
      // Others fronted the whole expense — what's owed TO them is
      // everyone else's share (total minus their own).
      const oursAmount = Number(e.amount) - othersAmount;
      if (oursAmount > 0) {
        net -= oursAmount;
        contributions.push({
          expense: e,
          signedAmount: -oursAmount,
          note: "Others paid — you owe your share",
        });
      }
    } else {
      net += othersAmount;
      contributions.push({
        expense: e,
        signedAmount: othersAmount,
        note: "You/Anubha paid — Others owe their share",
      });
    }
  }

  contributions.sort((a, b) => b.expense.expense_date.localeCompare(a.expense.expense_date));
  return { net, contributions };
}

export function GroupOthersBalance({ expenses }: { expenses: ExpenseWithRelations[] }) {
  const [expanded, setExpanded] = useState(false);
  const { net, contributions } = computeOthersBalance(expenses);

  if (contributions.length === 0) return null;

  const settled = Math.abs(net) < 0.5;

  return (
    <div className="mb-4 rounded-md border border-line bg-paper-raised p-5">
      <h2 className="mb-1 text-sm font-semibold">Owed by others</h2>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 py-1 text-left"
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
              <p className="mt-1 text-xs text-ink-soft">Others owe you</p>
            </>
          ) : (
            <>
              <p className="font-mono text-2xl font-semibold tabular tracking-tight text-spouse">
                {formatMoney(Math.abs(net))}
              </p>
              <p className="mt-1 text-xs text-ink-soft">You owe Others</p>
            </>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-ink-soft">
          {contributions.length} {contributions.length === 1 ? "entry" : "entries"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
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
    </div>
  );
}
