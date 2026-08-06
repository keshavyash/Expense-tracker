"use client";

import { Download } from "lucide-react";
import type { ExpenseWithRelations } from "@/lib/database.types";
import { expensesToCsv } from "@/lib/csv";

export function ExportCsvButton({
  expenses,
  filename,
}: {
  expenses: ExpenseWithRelations[];
  filename: string;
}) {
  function handleExport() {
    const csv = expensesToCsv(expenses);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={expenses.length === 0}
      className="flex items-center gap-1.5 rounded-sm border border-line px-3 py-1.5 text-xs text-ink-soft transition-std hover:border-ink hover:text-ink disabled:opacity-40"
    >
      <Download size={13} />
      Export CSV
    </button>
  );
}
