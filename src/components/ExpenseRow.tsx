import type { ExpenseWithRelations } from "@/lib/database.types";
import { formatMoney, formatDate, PAYMENT_METHOD_LABELS } from "@/lib/format";
import Link from "next/link";

function typeLabel(e: ExpenseWithRelations, currentMemberId: string) {
  if (e.expense_type === "common") return { label: "Common", cls: "bg-common-soft text-common" };
  if (e.owner_id === currentMemberId) return { label: "Personal (You)", cls: "bg-you-soft text-you" };
  return {
    label: `Personal (${e.owner?.name ?? "?"})`,
    cls: "bg-spouse-soft text-spouse",
  };
}

function fundedByLabel(e: ExpenseWithRelations, currentMemberId: string) {
  if (!e.funded_by) return "Common account";
  if (e.funded_by === currentMemberId) return "Your account";
  return `${e.funded_by_member?.name ?? "?"}'s account`;
}

export function ExpenseRow({
  expense,
  currentMemberId,
}: {
  expense: ExpenseWithRelations;
  currentMemberId: string;
}) {
  const t = typeLabel(expense, currentMemberId);

  return (
    <Link
      href={`/expenses/${expense.id}`}
      className="flex items-center gap-3 border-b border-line px-4 py-3 transition-std hover:bg-paper md:px-6"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">
            {expense.category?.name ?? "Uncategorized"}
          </span>
          <span className={`rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${t.cls}`}>
            {t.label}
          </span>
        </div>
        {(expense.vendor || expense.description) && (
          <p className="mt-0.5 truncate text-xs text-ink-soft">
            {expense.vendor?.name}
            {expense.vendor && expense.description ? " · " : ""}
            {expense.description}
          </p>
        )}
        <p className="mt-0.5 text-xs text-ink-soft">
          {formatDate(expense.expense_date)} · {PAYMENT_METHOD_LABELS[expense.payment_method]} ·{" "}
          {fundedByLabel(expense, currentMemberId)}
          {expense.added_by_profile ? ` · added by ${expense.added_by_profile.display_name}` : ""}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold tabular">
        {formatMoney(Number(expense.amount))}
      </span>
    </Link>
  );
}
