"use client";

import type { HouseholdMember } from "@/lib/database.types";
import { computeSplitShares, type SplitMethod, type SplitState } from "@/lib/split";
import { formatMoney } from "@/lib/format";

const METHODS: { value: SplitMethod; label: string }[] = [
  { value: "actual", label: "Actual ₹" },
  { value: "percent", label: "Percentage" },
  { value: "ratio", label: "Ratio" },
];

function partyLabel(
  partyType: "member" | "others",
  memberId: string | null,
  members: HouseholdMember[],
  currentMemberId: string
): string {
  if (partyType === "others") return "Others";
  if (memberId === currentMemberId) return "You";
  return members.find((m) => m.id === memberId)?.name ?? "?";
}

export function ExpenseSplitEditor({
  amount,
  members,
  currentMemberId,
  value,
  onChange,
}: {
  amount: number;
  members: HouseholdMember[];
  currentMemberId: string;
  value: SplitState;
  onChange: (v: SplitState) => void;
}) {
  const { shares, error } = computeSplitShares(value, amount);
  const placeholder = value.method === "percent" ? "%" : value.method === "ratio" ? "parts" : "₹";

  function updateParty(key: string, patch: Partial<{ included: boolean; input: string }>) {
    onChange({
      ...value,
      parties: value.parties.map((p) => (p.key === key ? { ...p, ...patch } : p)),
    });
  }

  return (
    <div className="rounded-sm border border-line p-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          className="h-3.5 w-3.5 rounded-sm border-line accent-common"
        />
        Split this expense
      </label>

      {value.enabled && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange({ ...value, method: m.value })}
                className={`rounded-sm border px-2 py-1 text-xs transition-std ${
                  value.method === m.value
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-soft"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {value.parties.map((p) => (
              <div key={p.key} className="flex items-center gap-2">
                <label className="flex w-20 shrink-0 items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={p.included}
                    onChange={(e) => updateParty(p.key, { included: e.target.checked })}
                    className="h-3.5 w-3.5 rounded-sm border-line accent-common"
                  />
                  {partyLabel(p.partyType, p.memberId, members, currentMemberId)}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  disabled={!p.included}
                  value={p.input}
                  onChange={(e) => updateParty(p.key, { input: e.target.value })}
                  placeholder={placeholder}
                  className="w-full flex-1 rounded-sm border border-line bg-paper-raised px-2 py-1.5 text-sm outline-none focus:border-ink disabled:opacity-40"
                />
              </div>
            ))}
          </div>

          {error ? (
            <p className="text-xs text-danger">{error}</p>
          ) : shares.length > 0 ? (
            <div className="space-y-0.5 rounded-sm bg-paper px-2 py-1.5 text-xs text-ink-soft">
              {shares.map((s, i) => (
                <p key={i} className="flex justify-between">
                  <span>{partyLabel(s.partyType, s.memberId, members, currentMemberId)}</span>
                  <span className="font-mono tabular">{formatMoney(s.amount)}</span>
                </p>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
