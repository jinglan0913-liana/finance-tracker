"use client";

import { useState } from "react";
import { useFinance } from "@/app/providers";
import type { Budget, ExpenseCategory } from "@/lib/types";

/*
  A deliberately tiny form: one number.

  The category comes from whichever card you clicked, and the month comes
  from the shared month selector, so neither needs asking about.
*/
export default function BudgetModal({
  category,
  budget,
  onClose,
}: {
  category: ExpenseCategory;
  /** The existing budget, if this category already has one this month. */
  budget?: Budget;
  onClose: () => void;
}) {
  const { selectedMonthId, selectedRange, saveBudget, deleteBudget } =
    useFinance();

  const [limit, setLimit] = useState(budget ? String(budget.limit) : "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = Number(limit);
    if (limit.trim() === "" || Number.isNaN(parsed)) {
      setError("Enter a number.");
      return;
    }
    if (parsed <= 0) {
      setError("Must be greater than zero.");
      return;
    }

    saveBudget({
      // Editing keeps the same id and month, so it replaces rather than adds.
      id: budget?.id ?? crypto.randomUUID(),
      month: budget?.month ?? selectedMonthId,
      category,
      limit: parsed,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-xl border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-medium">{category}</h2>
        {/* Says which month, so there is never any doubt what you're setting. */}
        <p className="mt-0.5 text-xs text-faint">{selectedRange.label}</p>

        <form onSubmit={handleSubmit} className="mt-4">
          <label htmlFor="limit" className="mb-1.5 block text-xs text-muted">
            Monthly budget
          </label>

          <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 focus-within:border-accent">
            <span className="text-sm text-faint">$</span>
            <input
              id="limit"
              type="number"
              step="0.01"
              min="0"
              autoFocus
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="500"
              className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-faint"
            />
          </div>

          {error && <p className="mt-2 text-xs text-negative">{error}</p>}

          <div className="mt-4 flex items-center justify-end gap-2">
            {/* Lets you clear a budget without a second dialog — the card
                simply goes back to "Not set", and you can retype it. */}
            {budget && (
              <button
                type="button"
                onClick={() => {
                  deleteBudget(budget.id);
                  onClose();
                }}
                className="mr-auto rounded-lg px-2 py-2 text-xs text-faint transition-colors hover:text-negative"
              >
                Remove
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
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
