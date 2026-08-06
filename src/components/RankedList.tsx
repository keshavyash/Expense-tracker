import Link from "next/link";
import { formatMoney } from "@/lib/format";

export interface RankedListItem {
  label: string;
  sublabel?: string;
  amount: number;
  href?: string;
}

export function RankedList({ items }: { items: RankedListItem[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-soft">No data yet.</p>;
  }

  return (
    <div className="divide-y divide-line">
      {items.map((item, i) => {
        const row = (
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm">{item.label}</p>
              {item.sublabel && (
                <p className="truncate text-xs text-ink-soft">{item.sublabel}</p>
              )}
            </div>
            <span className="shrink-0 font-mono text-sm font-medium tabular">
              {formatMoney(item.amount)}
            </span>
          </div>
        );
        return item.href ? (
          <Link
            key={i}
            href={item.href}
            className="-mx-1 block rounded-sm px-1 transition-std hover:bg-paper"
          >
            {row}
          </Link>
        ) : (
          <div key={i}>{row}</div>
        );
      })}
    </div>
  );
}
