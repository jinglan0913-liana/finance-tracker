"use client";

import Link from "next/link";
import { useAuth } from "@/app/auth-provider";
import { usePathname } from "next/navigation";
import {
  SignOutIcon,
  BudgetIcon,
  DashboardIcon,
  TransactionsIcon,
  WalletIcon,
} from "./icons";

/*
  "use client" is needed because this component uses usePathname() to know
  which link is currently active — that only works in the browser.
*/

const navItems = [
  { href: "/", label: "Dashboard", Icon: DashboardIcon },
  { href: "/accounts", label: "Accounts", Icon: WalletIcon },
  { href: "/transactions", label: "Transactions", Icon: TransactionsIcon },
  { href: "/budget", label: "Budget", Icon: BudgetIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      {/* Logo / app name */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-[13px] font-semibold text-white">
          F
        </div>
        <span className="text-sm font-semibold tracking-tight">Finance</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 px-3">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-elevated font-medium text-ink"
                  : "text-muted hover:bg-elevated/60 hover:text-ink"
              }`}
            >
              <Icon className={isActive ? "text-accent" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Pushes the footer to the bottom */}
      <div className="flex-1" />

      {/* Who is signed in, and the way out. */}
      <div className="m-3 rounded-lg border border-line bg-elevated/50 p-3">
        <p className="truncate text-xs text-ink" title={user.email ?? ""}>
          {user.email}
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-2 flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <SignOutIcon className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
