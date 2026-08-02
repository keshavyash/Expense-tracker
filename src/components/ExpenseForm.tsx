"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category, Expense, PaymentMethod, Profile } from "@/lib/database.types";
import { addExpense, deleteExpense, updateExpense, type ExpenseInput } from "@/lib/actions";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({
  categories,
  currentProfile,
  spouseProfile,
  existing,
}: {
  categories: Category[];
  currentProfile: Profile;
  spouseProfile: Profile | null;
  existing?: Expense;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [date, setDate] = useState(existing?.expense_date ?? todayISO());
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? categories[0]?.id ?? "");
  const [expenseType, setExpenseType] = useState<"personal" | "common">(
    existing?.expense_type ?? "personal"
  );
  const [ownerId, setOwnerId] = useState<string>(existing?.owner_id ?? currentProfile.id);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    existing?.payment_method ?? "upi"
  );
  const [description, setDescription] = useState(existing?.description ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (!categoryId) {
      setError("Choose a category.");
      return;
    }

    const input: ExpenseInput = {
      amount: parsedAmount,
      expense_date: date,
      category_id: categoryId,
      expense_type: expenseType,
      owner_id: expenseType === "personal" ? ownerId : null,
      payment_method: paymentMethod,
      description: description.trim() || null,
    };

    startTransition(async () => {
      try {
        if (existing) {
          await updateExpense(existing.id, input);
        } else {
          await addExpense(input);
        }
        router.push("/expenses");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleDelete() {
    if (!existing) return;
    if (!confirm("Delete this expense? This can't be undone.")) return;
    startTransition(async () => {
      try {
        await deleteExpense(existing.id);
        router.push("/expenses");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount + date */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-ink-soft">Amount (₹)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-sm border border-line bg-paper-raised px-3 py-2 font-mono outline-none focus:border-ink"
            placeholder="0.00"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-soft">Date</span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-sm border border-line bg-paper-raised px-3 py-2 outline-none focus:border-ink"
          />
        </label>
      </div>

      {/* Type selector */}
      <div>
        <span className="mb-1.5 block text-sm text-ink-soft">Type</span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setExpenseType("common")}
            className={`rounded-sm border px-3 py-2 text-sm transition-std ${
              expenseType === "common"
                ? "border-common bg-common-soft text-common"
                : "border-line text-ink-soft"
            }`}
          >
            Common
          </button>
          <button
            type="button"
            onClick={() => {
              setExpenseType("personal");
              setOwnerId(currentProfile.id);
            }}
            className={`rounded-sm border px-3 py-2 text-sm transition-std ${
              expenseType === "personal" && ownerId === currentProfile.id
                ? "border-you bg-you-soft text-you"
                : "border-line text-ink-soft"
            }`}
          >
            Personal (You)
          </button>
          <button
            type="button"
            disabled={!spouseProfile}
            onClick={() => {
              if (!spouseProfile) return;
              setExpenseType("personal");
              setOwnerId(spouseProfile.id);
            }}
            className={`rounded-sm border px-3 py-2 text-sm transition-std disabled:opacity-40 ${
              expenseType === "personal" && spouseProfile && ownerId === spouseProfile.id
                ? "border-spouse bg-spouse-soft text-spouse"
                : "border-line text-ink-soft"
            }`}
          >
            Personal (Spouse)
          </button>
        </div>
      </div>

      {/* Category */}
      <label className="block text-sm">
        <span className="mb-1 block text-ink-soft">Category</span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-sm border border-line bg-paper-raised px-3 py-2 outline-none focus:border-ink"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-ink-soft">
          Need a new one?{" "}
          <a href="/categories" className="text-common hover:underline">
            Add a category
          </a>
        </span>
      </label>

      {/* Payment method */}
      <div>
        <span className="mb-1.5 block text-sm text-ink-soft">Payment method</span>
        <div className="grid grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.value}
              type="button"
              onClick={() => setPaymentMethod(pm.value)}
              className={`rounded-sm border px-2 py-2 text-xs transition-std ${
                paymentMethod === pm.value
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-soft"
              }`}
            >
              {pm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <label className="block text-sm">
        <span className="mb-1 block text-ink-soft">Note (optional)</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-sm border border-line bg-paper-raised px-3 py-2 outline-none focus:border-ink"
          placeholder="e.g. Weekly groceries at BigBasket"
        />
      </label>

      {error && (
        <p className="rounded-sm bg-spouse-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-sm bg-common py-2.5 text-sm font-medium text-white transition-std hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : existing ? "Save changes" : "Add expense"}
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-sm border border-line px-4 py-2.5 text-sm text-danger transition-std hover:bg-spouse-soft disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
