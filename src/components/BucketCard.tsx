import Link from "next/link";
import { formatMoney } from "@/lib/format";

const styles = {
  common: { bg: "bg-common-soft", bar: "bg-common", text: "text-common" },
  you: { bg: "bg-you-soft", bar: "bg-you", text: "text-you" },
  spouse: { bg: "bg-spouse-soft", bar: "bg-spouse", text: "text-spouse" },
} as const;

export function BucketCard({
  label,
  total,
  count,
  variant,
  href,
}: {
  label: string;
  total: number;
  count: number;
  variant: keyof typeof styles;
  href: string;
}) {
  const s = styles[variant];
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-md border border-line bg-paper-raised p-5 transition-std hover:shadow-md"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} />
      <p className={`mb-3 inline-block rounded-sm ${s.bg} px-2 py-0.5 text-xs font-medium ${s.text}`}>
        {label}
      </p>
      <p className="font-mono text-2xl font-semibold tabular tracking-tight">
        {formatMoney(total)}
      </p>
      <p className="mt-1 text-xs text-ink-soft">
        {count} {count === 1 ? "entry" : "entries"} this month
      </p>
    </Link>
  );
}
