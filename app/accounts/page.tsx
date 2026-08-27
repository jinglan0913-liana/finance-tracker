"use client";

import { useState } from "react";
import { useFinance } from "@/app/providers";
import AccountCard from "@/components/AccountCard";
import AccountModal from "@/components/AccountModal";
import PageHeader from "@/components/PageHeader";
import { PlusIcon } from "@/components/icons";
import { CNY_PER_USD, currencyLabel } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { hasMixedCurrencies, sumInUsd, totalsByCurrency } from "@/lib/summary";
import type { Account } from "@/lib/types";

/*
  The accounts themselves do NOT live here any more. They live in the shared
  provider (app/providers.tsx), so that adding a transaction on the
  Transactions page moves the balances shown on this page too.

  The only state this page keeps is which modal is open — that is genuinely
  private to this screen.
*/

/** What the modal is doing right now: nothing, adding, or editing one account. */
type ModalState = { mode: "closed" } | { mode: "add" } | { mode: "edit"; account: Account };

export default function AccountsPage() {
  const { accounts, saveAccount, deleteAccount } = useFinance();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const closeModal = () => setModal({ mode: "closed" });

  // Recalculated on every render, straight from the shared list.
  const perCurrency = totalsByCurrency(accounts);
  const isMixed = hasMixedCurrencies(accounts);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <PageHeader
        title="Accounts"
        subtitle="All your balances in one place."
        action={
          <button
            type="button"
            onClick={() => setModal({ mode: "add" })}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            Add Account
          </button>
        }
      />

      {/* ---- Totals strip ---- */}
      <section className="mb-8 rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              Total balance{isMixed && " (estimated)"}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(sumInUsd(accounts))}
            </p>
            {isMixed && (
              <p className="mt-1 text-xs text-faint">
                RMB converted at a fixed rate of 1 USD = {CNY_PER_USD} RMB. Not a
                live rate.
              </p>
            )}
          </div>

          {/* One subtotal per currency, so the real numbers stay visible. */}
          <div className="flex gap-6">
            {perCurrency.map(({ currency, total }) => (
              <div key={currency}>
                <p className="text-xs text-faint">{currencyLabel[currency]}</p>
                <p className="mt-0.5 text-sm font-medium tabular-nums">
                  {formatCurrency(total, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Account cards ---- */}
      {accounts.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => setModal({ mode: "edit", account })}
            />
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-14 text-center">
          <p className="text-sm text-muted">No accounts yet</p>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-faint">
            Add your first account to start tracking. Transactions need an
            account to belong to.
          </p>
        </div>
      )}

      <p className="mt-6 text-xs text-faint">
        {accounts.length} {accounts.length === 1 ? "account" : "accounts"}.
        Balances include every transaction you add, and are saved to your
        database.
      </p>

      {/*
        Rendering the modal only while it is open, plus the `key`, guarantees
        a fresh form each time — so opening a different account always shows
        that account's details rather than the previous one's.
      */}
      {modal.mode !== "closed" && (
        <AccountModal
          key={modal.mode === "edit" ? modal.account.id : "new"}
          account={modal.mode === "edit" ? modal.account : undefined}
          onClose={closeModal}
          onSave={saveAccount}
          onDelete={deleteAccount}
        />
      )}
    </div>
  );
}
