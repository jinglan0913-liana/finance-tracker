"use client";

import { useFinance } from "@/app/providers";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

/** A coloured dot per category, so the list is scannable at a glance. */
const categoryDot: Record<Category, string> = {
  Income: "bg-positive",
  Transfer: "bg-blue-400",
  Housing: "bg-accent",
  Groceries: "bg-emerald-400",
  Dining: "bg-orange-400",
  Shopping: "bg-pink-400",
  Transportation: "bg-sky-400",
  Entertainment: "bg-fuchsia-400",
  Utilities: "bg-yellow-400",
  Subscriptions: "bg-violet-400",
  Pets: "bg-lime-400",
  Education: "bg-cyan-400",
  Travel: "bg-indigo-400",
  Healthcare: "bg-teal-400",
  Other: "bg-slate-400",
};

export default function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  // Read account names from the shared data, so a renamed account
  // shows its new name here straight away.
  const { getAccount } = useFinance();
  const from = getAccount(transaction.accountId);
  const to = getAccount(transaction.toAccountId);

  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";

  // "Groceries · BOA Checking", or "Chase Checking → Chase Savings"
  const detail = isTransfer
    ? `${from?.name ?? "Deleted account"} → ${to?.name ?? "Deleted account"}`
    : `${transaction.category} · ${from?.name ?? "Deleted account"}`;

  // Transfers show no +/−, because your total didn't actually change.
  const sign = isTransfer ? "" : isIncome ? "+" : "−";

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated/40">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${categoryDot[transaction.category]}`}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{transaction.description}</p>
        <p className="truncate text-xs text-faint">{detail}</p>
      </div>

      <span className="shrink-0 text-xs text-faint tabular-nums">
        {formatShortDate(transaction.date)}
      </span>

      <span
        className={`w-28 shrink-0 text-right text-sm font-medium tabular-nums ${
          isIncome ? "text-positive" : isTransfer ? "text-muted" : "text-ink"
        }`}
      >
        {sign}
        {formatCurrency(transaction.amount, transaction.currency)}
      </span>
    </div>
  );
}
