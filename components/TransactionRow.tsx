"use client";

import { useEffect, useRef, useState } from "react";
import { useFinance } from "@/app/providers";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import { MoreIcon, PencilIcon, TrashIcon } from "./icons";

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

const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors";

export default function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  /** Optional: when both are given, a three-dot actions menu appears. */
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  // Read account names from the shared data, so a renamed account
  // shows its new name here straight away.
  const { getAccount } = useFinance();
  const from = getAccount(transaction.accountId);
  const to = getAccount(transaction.toAccountId);

  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";

  const hasActions = onEdit !== undefined && onDelete !== undefined;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Clicking anywhere else, or pressing Escape, closes the menu.
  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointer(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setIsMenuOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

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

      {/* The actions menu. Only on pages that can act on a transaction. */}
      {hasActions && (
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={`Actions for ${transaction.description}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className={`rounded-md p-1 transition-colors hover:bg-elevated hover:text-ink ${
              isMenuOpen ? "bg-elevated text-ink" : "text-faint"
            }`}
          >
            <MoreIcon className="h-4 w-4" />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
                className={`${menuItemClass} text-muted hover:bg-elevated hover:text-ink`}
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
                className={`${menuItemClass} text-muted hover:bg-negative/10 hover:text-negative`}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
