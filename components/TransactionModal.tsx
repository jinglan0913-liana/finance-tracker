"use client";

import { useState } from "react";
import { useFinance } from "@/app/providers";
import type {
  Account,
  Category,
  Currency,
  Transaction,
  TransactionType,
} from "@/lib/types";
import { expenseCategories, incomeCategories } from "@/lib/types";
import { todayIso } from "@/lib/dates";
import { CloseIcon } from "./icons";

/*
  ONE form does two jobs:
    - no `transaction` prop  -> "Add transaction"
    - a `transaction` prop   -> "Edit transaction", every field pre-filled

  Writing it once means the two can never drift apart, and an edit always
  offers exactly the same choices that adding does.

  Which fields you see depends on the type:

    Expense   name, date, category, amount, account
    Income    name, date, category, amount, account
    Transfer  name, date,           amount, from account, to account

  There is no currency picker on purpose. A transaction always uses the
  currency of the account it touches, so the currency is *shown*, never chosen.

  Saving an edit does NOT overwrite the balances. The old transaction is
  reversed and the new one applied — see app/providers.tsx and
  supabase/add-transaction-rpc.sql.
*/

const types: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink " +
  "outline-none transition-colors placeholder:text-faint focus:border-accent";

const labelClass = "mb-1.5 block text-xs text-muted";

export default function TransactionModal({
  transaction,
  onClose,
}: {
  /** Leave undefined to add a new transaction; pass one to edit it. */
  transaction?: Transaction;
  onClose: () => void;
}) {
  const { accounts, addTransaction, updateTransaction } = useFinance();

  const isEditing = transaction !== undefined;

  /*
    These useState calls read `transaction` only once, when the modal
    appears. That works because the page gives this component a `key`, so
    opening a different transaction builds a fresh form rather than
    reusing the previous one's values.

    `||` rather than `??` on the two account ids: a transaction whose
    account has since been deleted arrives with an empty string, and that
    should fall back to a real account the same way a blank one does.
  */
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "expense",
  );
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(transaction?.date ?? todayIso());
  const [category, setCategory] = useState<Category>(
    transaction?.category ?? "Groceries",
  );
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : "",
  );
  const [accountId, setAccountId] = useState(
    transaction?.accountId || accounts[0]?.id || "",
  );
  const [toAccountId, setToAccountId] = useState(
    transaction?.toAccountId || accounts[1]?.id || "",
  );
  const [error, setError] = useState("");

  const isTransfer = type === "transfer";

  const fromAccount = accounts.find((a) => a.id === accountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  /*
    Rule for now: both sides of a transfer must use the same currency.
    Converting between them would need a real exchange rate, which we
    deliberately do not have yet.
  */
  const crossCurrency =
    isTransfer &&
    fromAccount !== undefined &&
    toAccount !== undefined &&
    fromAccount.currency !== toAccount.currency;

  const sameAccount = isTransfer && accountId === toAccountId;

  /** The currency this transaction will be recorded in. */
  const currency: Currency | undefined = fromAccount?.currency;

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setError("");
    // Keep the category sensible for the new type.
    if (next === "income") setCategory("Income");
    if (next === "expense") setCategory("Groceries");
    if (next === "transfer") setCategory("Transfer");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = description.trim();
    if (!trimmed) {
      setError("Please give the transaction a name.");
      return;
    }

    const parsedAmount = Number(amount);
    if (amount.trim() === "" || Number.isNaN(parsedAmount)) {
      setError("Amount must be a number.");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (!fromAccount) {
      setError("Please choose an account.");
      return;
    }
    if (isTransfer) {
      if (!toAccount) {
        setError("Please choose an account to transfer to.");
        return;
      }
      if (sameAccount) {
        setError("Choose two different accounts.");
        return;
      }
      if (crossCurrency) {
        setError("Cross-currency transfers are not supported yet.");
        return;
      }
    }

    const saved: Transaction = {
      // Editing keeps the same id, so the same row is rewritten.
      id: transaction?.id ?? crypto.randomUUID(),
      date,
      description: trimmed,
      type,
      category,
      amount: parsedAmount,
      // Taken from the account, never typed by hand.
      currency: fromAccount.currency,
      accountId: fromAccount.id,
      ...(isTransfer ? { toAccountId: toAccount!.id } : {}),
    };

    // Editing reverses the old transaction before applying this one.
    if (isEditing) updateTransaction(saved);
    else addTransaction(saved);
    onClose();
  }

  const categories = type === "income" ? incomeCategories : expenseCategories;

  /** Renders one <select> of accounts, with each balance's currency shown. */
  function accountOptions(list: Account[]) {
    return list.map((a) => (
      <option key={a.id} value={a.id}>
        {a.name} ({a.currency})
      </option>
    ));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-sm overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-medium">
            {isEditing ? "Edit transaction" : "Add transaction"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Nothing can be recorded without somewhere to record it against. */}
        {accounts.length === 0 ? (
          <p className="rounded-lg border border-line bg-canvas px-3 py-4 text-center text-xs leading-relaxed text-muted">
            You need an account first. Add one on the Accounts page, then come
            back here.
          </p>
        ) : (
        <>
        {/* ---- Type switcher: this is what reshapes the form ---- */}
        <div className="mb-5 flex gap-1 rounded-lg bg-canvas p-1">
          {types.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
                type === t.value
                  ? "bg-elevated font-medium text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="description" className={labelClass}>
              Name
            </label>
            <input
              id="description"
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isTransfer ? "e.g. Move to savings" : "e.g. Whole Foods"
              }
              className={fieldClass}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="date" className={labelClass}>
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex-1">
              <label htmlFor="amount" className={labelClass}>
                Amount {currency && <span className="text-faint">({currency})</span>}
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={fieldClass}
              />
            </div>
          </div>

          {/* Category is hidden for transfers — moving money has no category. */}
          {!isTransfer && (
            <div>
              <label htmlFor="category" className={labelClass}>
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={fieldClass}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="account" className={labelClass}>
              {isTransfer ? "From account" : "Account"}
            </label>
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={fieldClass}
            >
              {accountOptions(accounts)}
            </select>
          </div>

          {/* Only transfers have a second account. */}
          {isTransfer && (
            <div>
              <label htmlFor="toAccount" className={labelClass}>
                To account
              </label>
              <select
                id="toAccount"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className={fieldClass}
              >
                {accountOptions(accounts)}
              </select>
            </div>
          )}

          {/* Warn about a blocked transfer before the user hits Save. */}
          {crossCurrency && (
            <p className="rounded-lg border border-negative/30 bg-negative/5 px-3 py-2 text-xs text-negative">
              Cross-currency transfers are not supported yet.
            </p>
          )}
          {sameAccount && !crossCurrency && (
            <p className="rounded-lg border border-negative/30 bg-negative/5 px-3 py-2 text-xs text-negative">
              Choose two different accounts.
            </p>
          )}

          {error && <p className="text-xs text-negative">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={crossCurrency || sameAccount}
              className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isEditing ? "Save changes" : "Add transaction"}
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
