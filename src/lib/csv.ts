import type { ExpenseWithRelations } from "@/lib/database.types";
import { PAYMENT_METHOD_LABELS } from "@/lib/format";

function csvEscape(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function expensesToCsv(expenses: ExpenseWithRelations[]): string {
  const header = [
    "Date",
    "Amount (INR)",
    "Type",
    "Owner",
    "Category",
    "Vendor",
    "Group",
    "Payment Method",
    "Funded By",
    "Added By",
    "Note",
  ];

  const rows = expenses.map((e) => [
    e.expense_date,
    e.amount,
    e.expense_type === "common" ? "Common" : "Personal",
    e.expense_type === "personal" ? e.owner?.name ?? "" : "",
    e.category?.name ?? "",
    e.vendor?.name ?? "",
    e.group?.name ?? "",
    PAYMENT_METHOD_LABELS[e.payment_method],
    e.funded_by ? e.funded_by_member?.name ?? "" : "Common account",
    e.added_by_profile?.display_name ?? "",
    e.description ?? "",
  ]);

  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
}
