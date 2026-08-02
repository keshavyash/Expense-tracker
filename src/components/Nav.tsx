"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Tags, BarChart3, Plus, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/categories", label: "Categories", icon: Tags },
];

export function Nav({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-line md:bg-paper-raised">
        <div className="flex items-center gap-2 border-b border-line px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink font-mono text-sm text-paper">
            ₹
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Ledger</p>
            <p className="text-xs text-ink-soft leading-tight">{displayName}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-std ${
                  active
                    ? "bg-ink text-paper"
                    : "text-ink-soft hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <Link
            href="/expenses/new"
            className="mb-2 flex items-center justify-center gap-2 rounded-sm bg-common py-2 text-sm font-medium text-white transition-std hover:opacity-90"
          >
            <Plus size={16} />
            Add expense
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-ink-soft transition-std hover:bg-paper hover:text-ink"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-line bg-paper-raised px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink font-mono text-xs text-paper">
            ₹
          </div>
          <p className="text-sm font-semibold">Ledger</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-ink-soft">
            <LogOut size={18} />
          </button>
        </form>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-line bg-paper-raised px-1 py-1.5 md:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-sm py-1.5 text-[11px] transition-std ${
                active ? "text-common" : "text-ink-soft"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile floating add button */}
      <Link
        href="/expenses/new"
        className="fixed bottom-16 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-common text-white shadow-lg transition-std hover:opacity-90 md:hidden"
        aria-label="Add expense"
      >
        <Plus size={24} />
      </Link>
    </>
  );
}
