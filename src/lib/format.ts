const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Card",
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank transfer",
  sodexo: "Sodexo",
};
