"use client";

import { useEffect, useState } from "react";
import { currencyLabel } from "@/lib/currency";
import type { Account, AccountType, Currency } from "@/lib/types";
import { CloseIcon, TrashIcon } from "./icons";

/*
  ONE modal does two jobs:
    - no `account` prop  -> "Add account"
    - an `account` prop  -> "Edit account", with the fields pre-filled
                            and a Delete option at the bottom.

  Writing it once means the form can never drift apart between the two.
*/

const accountTypes: AccountType[] = [
  "Checking",
  "Savings",
  "Cash",
  "Wallet",
  "Credit Card",
  "Investment",
];

const currencies: Currency[] = ["USD", "CNY"];

/** Shared styling for the inputs, so they all look identical. */
const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink " +
  "outline-none transition-colors placeholder:text-faint focus:border-accent";

export default function AccountModal({
  account,
  onClose,
  onSave,
  onDelete,
}: {
  /** Leave undefined to add a new account; pass one to edit it. */
  account?: Account;
  onClose: () => void;
  onSave: (account: Account) => void;
  onDelete: (id: string) => void;
}) {
  const isEditing = account !== undefined;

  /*
    These useState calls read `account` only once, when the modal appears.
    That works because the Accounts page gives this component a `key`, which
    tells React to build a fresh modal every time you open a different one.
  */
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "Checking");
  const [currency, setCurrency] = useState<Currency>(account?.currency ?? "USD");
  const [balance, setBalance] = useState(
    account ? String(account.balance) : "",
  );
  const [error, setError] = useState("");
  // Becomes true once you click Delete, which swaps in the confirmation step.
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Let the Escape key close the modal.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // Stop the browser from reloading the page.

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please give the account a name.");
      return;
    }

    const parsedBalance = Number(balance);
    if (balance.trim() === "" || Number.isNaN(parsedBalance)) {
      setError("Balance must be a number.");
      return;
    }

    onSave({
      // Keep everything we aren't editing (id, institution, last4)...
      ...(account ?? {
        id: crypto.randomUUID(),
        institution: "Added by you",
        last4: "",
      }),
      // ...then overwrite the four fields the form controls.
      name: trimmedName,
      type,
      balance: parsedBalance,
      currency,
    });

    onClose();
  }

  return (
    // The dark backdrop. Clicking it closes the modal.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      {/* stopPropagation keeps clicks inside the panel from closing it. */}
      <div
        className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-medium">
            {isEditing ? "Edit account" : "Add account"}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs text-muted">
              Account name
            </label>
            <input
              id="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chase Checking"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="type" className="mb-1.5 block text-xs text-muted">
              Account type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className={fieldClass}
            >
              {accountTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="balance"
                className="mb-1.5 block text-xs text-muted"
              >
                {isEditing ? "Current balance" : "Starting balance"}
              </label>
              <input
                id="balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className={fieldClass}
              />
            </div>
            <div className="w-28">
              <label
                htmlFor="currency"
                className="mb-1.5 block text-xs text-muted"
              >
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className={fieldClass}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {currencyLabel[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-negative">{error}</p>}

          <div className="mt-1 flex items-center justify-end gap-2">
            {/* Delete lives on the left, away from the save button. */}
            {isEditing && !confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="mr-auto flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-negative/10 hover:text-negative"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {isEditing ? "Save changes" : "Add account"}
            </button>
          </div>
        </form>

        {/* The confirmation step. Only appears after clicking Delete. */}
        {confirmingDelete && account && (
          <div className="mt-4 rounded-lg border border-negative/30 bg-negative/5 p-3.5">
            <p className="text-sm text-ink">Delete “{account.name}”?</p>
            <p className="mt-1 text-xs text-faint">
              This removes the account from the page. It cannot be undone.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-elevated hover:text-ink"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(account.id);
                  onClose();
                }}
                className="rounded-lg bg-negative px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Yes, delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
