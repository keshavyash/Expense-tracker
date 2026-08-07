"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  Category,
  Expense,
  Group,
  HouseholdMember,
  PaymentMethod,
  Vendor,
} from "@/lib/database.types";
import { addExpense, deleteExpense, updateExpense, type ExpenseInput } from "@/lib/actions";
import { VendorCombobox } from "@/components/VendorCombobox";
import { todayIST } from "@/lib/dates";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "sodexo", label: "Sodexo" },
];

function memberLabel(m: HouseholdMember, currentMemberId: string) {
  return m.id === currentMemberId ? "You" : m.name;
}

export function ExpenseForm({
  categories,
  vendors,
  groups,
  members,
  currentMemberId,
  existing,
  existingVendorName,
  defaultGroupId,
}: {
  categories: Category[];
  vendors: Vendor[];
  groups: Group[];
  members: HouseholdMember[];
  currentMemberId: string;
  existing?: Expense;
  existingVendorName?: string | null;
  defaultGroupId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [date, setDate] = useState(existing?.expense_date ?? todayIST());
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? categories[0]?.id ?? "");
  const [expenseType, setExpenseType] = useState<"personal" | "common">(
    existing?.expense_type ?? (defaultGroupId ? "common" : "personal")
  );
  const [ownerId, setOwnerId] = useState<string>(existing?.owner_id ?? currentMemberId);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    existing?.payment_method ?? "upi"
  );
  const [fundedBy, setFundedBy] = useState<string | null>(
    existing ? existing.funded_by : currentMemberId
  );
  const [vendorName, setVendorName] = useState(existingVendorName ?? "");
  const [groupId, setGroupId] = useState<string>(existing?.group_id ?? defaultGroupId ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");

  const sodexoOwner = members.find((m) => m.owns_sodexo);

  function buildInput(): ExpenseInput | null {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter an amount greater than 0.");
      return null;
    }
    if (!categoryId) {
      setError("Choose a category.");
      return null;
    }
    return {
      amount: parsedAmount,
      expense_date: date,
      category_id: categoryId,
      expense_type: expenseType,
      owner_id: expenseType === "personal" ? ownerId : null,
      payment_method: paymentMethod,
      funded_by: fundedBy,
      vendor_name: vendorName.trim() || null,
      group_id: groupId || null,
      description: description.trim() || null,
    };
  }

  function handleSubmit(e: React.FormEvent, andAddAnother = false) {
    e.preventDefault();
    setError(null);
    setSavedNotice(false);

    const input = buildInput();
    if (!input) return;

    startTransition(async () => {
      try {
        if (existing) {
          await updateExpense(existing.id, input);
          router.push("/expenses");
          router.refresh();
          return;
        }

        await addExpense(input);

        if (andAddAnother) {
          setAmount("");
          setVendorName("");
          setDescription("");
          setSavedNotice(true);
          amountRef.current?.focus();
          router.refresh();
        } else {
          router.push("/expenses");
          router.refresh();
        }
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
    <>
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-5 pb-4">
      {/* Amount + date */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-ink-soft">Amount (₹)</span>
          <input
            ref={amountRef}
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setExpenseType("common")}
            className={`min-w-[100px] flex-1 rounded-sm border px-3 py-2 text-sm transition-std ${
              expenseType === "common"
                ? "border-common bg-common-soft text-common"
                : "border-line text-ink-soft"
            }`}
          >
            Common
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setExpenseType("personal");
                setOwnerId(m.id);
              }}
              className={`min-w-[100px] flex-1 rounded-sm border px-3 py-2 text-sm transition-std ${
                expenseType === "personal" && ownerId === m.id
                  ? m.id === currentMemberId
                    ? "border-you bg-you-soft text-you"
                    : "border-spouse bg-spouse-soft text-spouse"
                  : "border-line text-ink-soft"
              }`}
            >
              Personal ({memberLabel(m, currentMemberId)})
            </button>
          ))}
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
          <Link href="/categories" className="text-common hover:underline">
            Add a category
          </Link>
        </span>
      </label>

      {/* Group */}
      <label className="block text-sm">
        <span className="mb-1 block text-ink-soft">Group (optional)</span>
        <select
          value={groupId}
          onChange={(e) => {
            const newGroupId = e.target.value;
            setGroupId(newGroupId);
            // Selecting a group defaults the expense to Common — trip/event
            // spends are usually shared. Still editable below afterward.
            if (newGroupId && !groupId) {
              setExpenseType("common");
            }
          }}
          className="w-full rounded-sm border border-line bg-paper-raised px-3 py-2 outline-none focus:border-ink"
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-ink-soft">
          For tracking a trip or event across several expenses.{" "}
          <Link href="/groups" className="text-common hover:underline">
            Manage groups
          </Link>
        </span>
      </label>

      {/* Vendor */}
      <label className="block text-sm">
        <span className="mb-1 block text-ink-soft">Vendor (optional)</span>
        <VendorCombobox vendors={vendors} value={vendorName} onChange={setVendorName} />
      </label>

      {/* Payment method */}
      <div>
        <span className="mb-1.5 block text-sm text-ink-soft">Payment method</span>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.value}
              type="button"
              onClick={() => {
                setPaymentMethod(pm.value);
                // Sodexo is a personal benefit card belonging to one
                // specific person — always funds from their account,
                // regardless of who's filling out this form.
                if (pm.value === "sodexo") {
                  setFundedBy(sodexoOwner?.id ?? currentMemberId);
                }
              }}
              className={`min-w-[80px] flex-1 rounded-sm border px-2 py-2 text-xs transition-std ${
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

      {/* Funded by (whose account paid) */}
      <div>
        <span className="mb-1.5 block text-sm text-ink-soft">Paid from</span>
        {paymentMethod === "sodexo" ? (
          <p className="rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink-soft">
            {sodexoOwner
              ? `${memberLabel(sodexoOwner, currentMemberId)}'s account — Sodexo always funds from the designated owner's balance.`
              : "No Sodexo owner set yet — set one from the Categories & household page. Defaulting to your account for now."}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFundedBy(null)}
                className={`min-w-[100px] flex-1 rounded-sm border px-3 py-2 text-sm transition-std ${
                  fundedBy === null
                    ? "border-common bg-common-soft text-common"
                    : "border-line text-ink-soft"
                }`}
              >
                Common account
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFundedBy(m.id)}
                  className={`min-w-[100px] flex-1 rounded-sm border px-3 py-2 text-sm transition-std ${
                    fundedBy === m.id
                      ? m.id === currentMemberId
                        ? "border-you bg-you-soft text-you"
                        : "border-spouse bg-spouse-soft text-spouse"
                      : "border-line text-ink-soft"
                  }`}
                >
                  {memberLabel(m, currentMemberId)}&apos;s account
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-soft">
              Which card/UPI/account actually paid — separate from who the spend counts against
              above.
            </p>
          </>
        )}
      </div>

      {/* Description */}
      <label className="block text-sm">
        <span className="mb-1 block text-ink-soft">Note (optional)</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-sm border border-line bg-paper-raised px-3 py-2 outline-none focus:border-ink"
          placeholder="e.g. Weekly groceries"
        />
      </label>

      {error && (
        <p className="rounded-sm bg-spouse-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {savedNotice && !error && (
        <p className="rounded-sm bg-common-soft px-3 py-2 text-sm text-common">
          Saved. Add another below, or head to the list when you&apos;re done.
        </p>
      )}
      </form>

      {/* Fixed so the save actions are always reachable without scrolling —
          sits above the mobile bottom tab bar, and flush with the bottom
          of the content column (past the sidebar) on desktop. */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-paper-raised px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] md:inset-x-auto md:left-56 md:right-0 md:bottom-0 md:px-8">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            form="expense-form"
            disabled={pending}
            className="flex-1 rounded-sm bg-common py-2.5 text-sm font-medium text-white transition-std hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : existing ? "Save changes" : "Save expense"}
          </button>
          {!existing && (
            <button
              type="button"
              disabled={pending}
              onClick={(e) => handleSubmit(e, true)}
              className="flex-1 rounded-sm border border-common py-2.5 text-sm font-medium text-common transition-std hover:bg-common-soft disabled:opacity-50"
            >
              Save &amp; add another
            </button>
          )}
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
      </div>
    </>
  );
}
