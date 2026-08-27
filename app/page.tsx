"use client";

import Link from "next/link";
import { useFinance } from "@/app/providers";
import AccountCard from "@/components/AccountCard";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import TransactionRow from "@/components/TransactionRow";
import {
  PiggyIcon,
  TrendDownIcon,
  TrendUpIcon,
  WalletIcon,
} from "@/components/icons";
import { filterByMonth } from "@/lib/dates";
import { getMonthlySummary, sumInUsd } from "@/lib/summary";

export default function DashboardPage() {
  // The same shared data the other pages use, so these numbers always agree.
  const { accounts, transactions, selectedRange } = useFinance();

  // Account balances are TODAY's balances — they ignore the month selector.
  const totalBalance = sumInUsd(accounts);

  // Everything below reports on the selected month only.
  const { income, expenses, saved, savingsRate } = getMonthlySummary(
    transactions,
    selectedRange,
  );
  const monthTransactions = filterByMonth(transactions, selectedRange);
  const recentTransactions = monthTransactions.slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <PageHeader
        title="Dashboard"
        subtitle="Here's where your money stands right now."
        action={<MonthSelector />}
      />

      {/* ---- The four summary tiles ---- */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total balance"
          amount={totalBalance}
          caption={`Across ${accounts.length} accounts · today`}
          Icon={WalletIcon}
        />
        <StatCard
          label="This Month Income"
          amount={income}
          caption={selectedRange.shortLabel}
          tone="positive"
          Icon={TrendUpIcon}
        />
        <StatCard
          label="This Month Expenses"
          amount={expenses}
          caption={selectedRange.shortLabel}
          tone="negative"
          Icon={TrendDownIcon}
        />
        <StatCard
          label="Amount Saved"
          amount={saved}
          caption={
            income > 0
              ? `${savingsRate.toFixed(0)}% of income kept`
              : selectedRange.label
          }
          tone={saved >= 0 ? "positive" : "negative"}
          Icon={PiggyIcon}
        />
      </section>

      {/* ---- Account cards ---- */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-medium">Accounts</h2>
          <Link
            href="/accounts"
            className="text-xs text-muted transition-colors hover:text-ink"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </section>

      {/* ---- Recent transactions ---- */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-medium">Recent transactions</h2>
          <Link
            href="/transactions"
            className="text-xs text-muted transition-colors hover:text-ink"
          >
            View all →
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {recentTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
            <p className="text-sm text-muted">
              No transactions for {selectedRange.label}
            </p>
            <Link
              href="/transactions"
              className="mt-3 inline-block rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Add Transaction
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
