"use client";

import { useState } from "react";
import { useFinance } from "@/app/providers";
import BudgetCard from "@/components/BudgetCard";
import BudgetModal from "@/components/BudgetModal";
import DonutChart from "@/components/DonutChart";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import {
  BudgetIcon,
  PiggyIcon,
  TrendDownIcon,
  WalletIcon,
} from "@/components/icons";
import {
  getBudgetGrid,
  getBudgetTotals,
  getSpendingBreakdown,
} from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import type { ExpenseCategory } from "@/lib/types";

export default function BudgetPage() {
  const { budgets, transactions, selectedMonthId, selectedRange } =
    useFinance();
  // Which category's budget is being edited, if any.
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);

  /*
    Everything below is derived from the SELECTED month. The donut and the
    cards both come from the same spending figures (getSpentByCategory),
    so the chart and the cards can never tell different stories.
  */
  const lines = getBudgetGrid(
    budgets,
    selectedMonthId,
    transactions,
    selectedRange,
  );
  const totals = getBudgetTotals(lines);
  const { slices, total } = getSpendingBreakdown(transactions, selectedRange);

  const isOver = totals.status === "over";
  const editingBudget = budgets.find(
    (b) => b.month === selectedMonthId && b.category === editing,
  );

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <PageHeader
        title="Budget"
        subtitle="What you planned to spend, against what you actually spent."
        action={<MonthSelector />}
      />

      {/* ---- Summary for the selected month ---- */}
      <p className="mb-3 text-sm text-muted">{selectedRange.label}</p>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Budget"
          amount={totals.totalBudget}
          caption={
            totals.budgetedCount > 0
              ? `${totals.budgetedCount} of ${lines.length} categories set`
              : "No budgets set yet"
          }
          Icon={WalletIcon}
        />
        <StatCard
          label="Spent"
          amount={totals.totalSpent}
          caption="Expenses only"
          /* Neutral while you're within budget — colour is reserved for
             actually being near or past the limit. */
          tone={isOver ? "negative" : "neutral"}
          Icon={TrendDownIcon}
        />
        <StatCard
          /* Once you pass the limit, "Remaining" stops making sense — the
             tile becomes an over-budget figure instead. */
          label={isOver ? "Over Budget" : "Remaining"}
          amount={Math.abs(totals.remaining)}
          valueText={totals.totalBudget === 0 ? "—" : undefined}
          caption={
            totals.totalBudget === 0
              ? "Set a budget to track this"
              : isOver
                ? "Spent more than planned"
                : "Left to spend"
          }
          tone={isOver ? "negative" : "neutral"}
          Icon={PiggyIcon}
        />
        <StatCard
          label="Budget Used"
          amount={totals.percentUsed}
          valueText={
            totals.totalBudget === 0
              ? "—"
              : `${totals.percentUsed.toFixed(1)}%`
          }
          caption={
            totals.totalBudget === 0 ? "No budgets set yet" : "of total budget"
          }
          /* neutral -> amber past 75% -> red past 100% */
          tone={
            totals.status === "over"
              ? "negative"
              : totals.status === "warning"
                ? "warning"
                : "neutral"
          }
          Icon={BudgetIcon}
        />
      </section>

      {/* ---- Chart on the left, category cards on the right ---- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[16.5rem_1fr]">
        <DonutChart
          slices={slices}
          total={total}
          monthLabel={selectedRange.label}
        />

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-medium">Categories</h2>
                <p className="text-xs text-faint">
              Click a card to set its budget
            </p>
          </div>

          {/* Fixed two columns — every category always has a place. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lines.map((line) => (
              <BudgetCard
                key={line.category}
                line={line}
                onEdit={() => setEditing(line.category)}
              />
            ))}
          </div>
        </section>
      </div>

      <p className="mt-6 text-xs text-faint">
        Spending is counted from expense transactions only — income and
        transfers never affect a budget or the chart. Budgets are set per
        month, so {selectedRange.label} is independent of every other month.
      </p>

      {editing && (
        <BudgetModal
          key={`${selectedMonthId}-${editing}`}
          category={editing}
          budget={editingBudget}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
