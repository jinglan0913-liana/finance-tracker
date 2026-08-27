"use client";

import { useEffect } from "react";
import { useFinance } from "@/app/providers";
import { formatCurrency } from "@/lib/format";
import type { Transaction } from "@/lib/types";

/*
  The step between clicking Delete and the money actually moving.

  Deleting a transaction is not just removing a line from a list — it
  changes account balances. So the dialog says, in plain words and with
  the real account names, exactly which balances are about to move and in
  which direction. Nothing is deleted until "Delete Transaction" is clicked.
*/

export default function DeleteTransactionDialog({
  transaction,
  onCancel,
  onConfirm,
}: {
  transaction: Transaction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { getAccount } = useFinance();

  const from = getAccount(transaction.accountId);
  const to = getAccount(transaction.toAccountId);
  const money = formatCurrency(transaction.amount, transaction.currency);

  // Named for what it does to each balance, not for the transaction type.
  const fromName = from?.name ?? "the deleted account";
  const toName = to?.name ?? "the deleted account";

  const effect =
    transaction.type === "expense" ? (
      <>
        {money} will be <strong className="font-medium text-ink">added back</strong>{" "}
        to {fromName}.
      </>
    ) : transaction.type === "income" ? (
      <>
        {money} will be{" "}
        <strong className="font-medium text-ink">subtracted from</strong> {fromName}.
      </>
    ) : (
      <>
        {money} will be <strong className="font-medium text-ink">added back</strong>{" "}
        to {fromName} and{" "}
        <strong className="font-medium text-ink">subtracted from</strong> {toName}.
      </>
    );

  // Escape cancels, the same as everywhere else in the app.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-transaction-title"
        className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-transaction-title" className="text-base font-medium">
          Delete this transaction?
        </h2>

        <p className="mt-2 truncate text-sm text-muted">
          {transaction.description} · {money}
        </p>

        <div className="mt-4 rounded-lg border border-line bg-canvas px-3.5 py-3">
          <p className="text-xs leading-relaxed text-muted">
            Deleting this also reverses its effect on your account balances.{" "}
            {effect}
          </p>
        </div>

        <p className="mt-3 text-xs text-faint">This cannot be undone.</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="rounded-lg bg-negative px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Delete Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
