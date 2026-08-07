export type SplitMethod = "actual" | "percent" | "ratio";

export interface SplitPartyState {
  key: string; // "member:<id>" or "others"
  partyType: "member" | "others";
  memberId: string | null;
  included: boolean;
  input: string; // raw text; meaning depends on method
}

export interface SplitState {
  enabled: boolean;
  method: SplitMethod;
  parties: SplitPartyState[];
}

export interface ComputedShare {
  partyType: "member" | "others";
  memberId: string | null;
  amount: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Distributes `totalAmount` across `values` proportionally, then nudges the
// last entry so the shares always sum to exactly totalAmount (handles the
// inevitable rounding remainder from splitting paise three ways).
function distribute(values: number[], denominator: number, totalAmount: number): number[] {
  const raw = values.map((v) => (totalAmount * v) / denominator);
  const rounded = raw.map(round2);
  const sum = round2(rounded.reduce((a, b) => a + b, 0));
  const remainder = round2(totalAmount - sum);
  if (rounded.length > 0) {
    rounded[rounded.length - 1] = round2(rounded[rounded.length - 1] + remainder);
  }
  return rounded;
}

export function computeSplitShares(
  state: SplitState,
  totalAmount: number
): { shares: ComputedShare[]; error: string | null } {
  if (!state.enabled) return { shares: [], error: null };

  const included = state.parties.filter((p) => p.included);
  if (included.length === 0) {
    return { shares: [], error: "Select at least one person to split with." };
  }
  if (!totalAmount || totalAmount <= 0) {
    return { shares: [], error: null };
  }

  const values = included.map((p) => parseFloat(p.input) || 0);

  if (state.method === "actual") {
    const sum = round2(values.reduce((a, b) => a + b, 0));
    const remaining = round2(totalAmount - sum);
    if (Math.abs(remaining) >= 0.01) {
      return {
        shares: [],
        error:
          remaining > 0
            ? `₹${remaining.toFixed(2)} left to assign.`
            : `₹${Math.abs(remaining).toFixed(2)} over the total.`,
      };
    }
    return {
      shares: included.map((p, i) => ({
        partyType: p.partyType,
        memberId: p.memberId,
        amount: values[i],
      })),
      error: null,
    };
  }

  if (state.method === "percent") {
    const sumPct = round2(values.reduce((a, b) => a + b, 0));
    if (Math.abs(sumPct - 100) >= 0.01) {
      return {
        shares: [],
        error: `Percentages should add up to 100% (currently ${sumPct}%).`,
      };
    }
    const amounts = distribute(values, 100, totalAmount);
    return {
      shares: included.map((p, i) => ({
        partyType: p.partyType,
        memberId: p.memberId,
        amount: amounts[i],
      })),
      error: null,
    };
  }

  // ratio
  const sumRatio = values.reduce((a, b) => a + b, 0);
  if (sumRatio <= 0) {
    return { shares: [], error: "Enter a ratio greater than 0 for at least one person." };
  }
  const amounts = distribute(values, sumRatio, totalAmount);
  return {
    shares: included.map((p, i) => ({
      partyType: p.partyType,
      memberId: p.memberId,
      amount: amounts[i],
    })),
    error: null,
  };
}
