"use client";

import { useState } from "react";
import { useFinance } from "@/app/providers";
import DeleteTransactionDialog from "@/components/DeleteTransactionDialog";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import TransactionModal from "@/components/TransactionModal";
import TransactionRow from "@/components/TransactionRow";
import { PlusIcon, TrendDownIcon, TrendUpIcon } from "@/components/icons";
import { filterByMonth } from "@/lib/dates";
import { getMonthlySummary } from "@/lib/summary";
import type { Transaction } from "@/lib/types";

/*
  What the modal is doing right now: nothing, adding, editing one
  transaction, or asking whether to delete one. Keeping it as a single
  value rather than three booleans means two of them can never be open
  at once.
*/
type ModalState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; transaction: Transaction }
  | { mode: "delete"; transaction: Transaction };

export default function TransactionsPage() {
  // Read from the shared data, so anything added here shows up everywhere.
  const { transactions, selectedRange, deleteTransaction } = useFinance();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const closeModal = () => setModal({ mode: "closed" });

  // Only this month's transactions are shown. The rest stay in the data,
  // ready for whichever month you switch to next.
  const monthTransactions = filterByMonth(transactions, selectedRange);
  const summary = getMonthlySummary(transactions, selectedRange);
  const transferCount = monthTransactions.filter(
    (t) => t.type === "transfer",
  ).length;

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <PageHeader
        title="Transactions"
        subtitle="Every purchase, payment and transfer."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <MonthSelector />
            <button
              type="button"
              onClick={() => setModal({ mode: "add" })}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <PlusIcon className="h-4 w-4" />
              Add Transaction
            </button>
          </div>
        }
      />

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="This Month Income"
          amount={summary.income}
          caption={`${selectedRange.shortLabel} · USD equivalent`}
          tone="positive"
          Icon={TrendUpIcon}
        />
        <StatCard
          label="This Month Expenses"
          amount={summary.expenses}
          caption={`${selectedRange.shortLabel} · USD equivalent`}
          tone="negative"
          Icon={TrendDownIcon}
        />
      </section>

      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-medium">{selectedRange.label}</h2>
        <p className="text-xs text-faint">
          {monthTransactions.length}{" "}
          {monthTransactions.length === 1 ? "transaction" : "transactions"}
          {transferCount > 0 && ` · ${transferCount} transfers`}
        </p>
      </div>

      {monthTransactions.length > 0 ? (
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {monthTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onEdit={() => setModal({ mode: "edit", transaction })}
              onDelete={() => setModal({ mode: "delete", transaction })}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
          <p className="text-sm text-muted">
            No transactions for {selectedRange.label}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-faint">
            Add an expense, income or transfer and your account balances will
            update straight away.
          </p>
          <button
            type="button"
            onClick={() => setModal({ mode: "add" })}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      )}

      {transferCount > 0 && (
        <p className="mt-6 text-xs text-faint">
          Transfers move money between your own accounts, so they are not
          counted as income, expenses or savings.
        </p>
      )}

      {/*
        Rendering the modal only while it is open, plus the `key`,
        guarantees a fresh form each time — so opening a different
        transaction always shows that one's values, never the last one's.
      */}
      {(modal.mode === "add" || modal.mode === "edit") && (
        <TransactionModal
          key={modal.mode === "edit" ? modal.transaction.id : "new"}
          transaction={modal.mode === "edit" ? modal.transaction : undefined}
          onClose={closeModal}
        />
      )}

      {/* Nothing is deleted until this is confirmed. */}
      {modal.mode === "delete" && (
        <DeleteTransactionDialog
          transaction={modal.transaction}
          onCancel={closeModal}
          onConfirm={() => {
            deleteTransaction(modal.transaction.id);
            closeModal();
          }}
        />
      )}
    </div>
  );
}
