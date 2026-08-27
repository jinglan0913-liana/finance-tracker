import { toUsd } from "./currency";
import { isInRange, type MonthRange } from "./dates";
import {
  budgetCategoryOrder,
  type Budget,
  type ExpenseCategory,
  type Transaction,
} from "./types";

/*
  All budget maths lives here, as plain functions with no React in them.
  Pass in the budgets and the transactions, get numbers back.
*/

/** How close to the limit you are. Drives the colours on the page. */
export type BudgetStatus = "unset" | "normal" | "warning" | "over";

/** Everything the UI needs to draw one budget card. */
export type BudgetLine = {
  category: ExpenseCategory;
  /** Undefined when no budget has been set for this category this month. */
  budgetId?: string;
  /** null means "Not set". */
  limit: number | null;
  spent: number;
  /** null while there is no limit to measure against. */
  remaining: number | null;
  percentUsed: number | null;
  status: BudgetStatus;
};

const WARNING_AT = 75;
const OVER_AT = 100;

export function getStatus(percentUsed: number | null): BudgetStatus {
  if (percentUsed === null) return "unset";
  if (percentUsed >= OVER_AT) return "over";
  if (percentUsed >= WARNING_AT) return "warning";
  return "normal";
}

/**
 * Adds up spending per category for one month.
 *
 * Only `type === "expense"` is counted, so income and transfers can never
 * reach a budget or the chart. Amounts are converted to USD first, because
 * budgets are set in USD and a transaction may have been made in RMB.
 *
 * This is the ONE place spending is counted — the donut chart, the cards and
 * the totals all read from it, so they can never disagree.
 */
export function getSpentByCategory(
  transactions: Transaction[],
  range: MonthRange,
): Map<ExpenseCategory, number> {
  const spent = new Map<ExpenseCategory, number>();

  for (const t of transactions) {
    if (t.type !== "expense") continue; // income and transfers are not spending
    if (!isInRange(t.date, range)) continue; // wrong month

    const category = t.category as ExpenseCategory;
    spent.set(category, (spent.get(category) ?? 0) + toUsd(t.amount, t.currency));
  }

  return spent;
}

/** Only the budgets belonging to one month, e.g. "2026-08". */
export function getBudgetsForMonth(
  budgets: Budget[],
  monthId: string,
): Budget[] {
  return budgets.filter((b) => b.month === monthId);
}

/**
 * One card per category, in a fixed order.
 *
 * The default categories are ALWAYS included, whether or not a budget has
 * been set for them — that is what makes the grid stable rather than
 * something you have to build up by hand. Any other category that has
 * spending this month is appended, so money is never hidden.
 */
export function getBudgetGrid(
  budgets: Budget[],
  monthId: string,
  transactions: Transaction[],
  range: MonthRange,
): BudgetLine[] {
  const spentByCategory = getSpentByCategory(transactions, range);
  const monthBudgets = getBudgetsForMonth(budgets, monthId);

  // Defaults first, then anything else that has spending or a budget.
  const extras = [
    ...new Set([...spentByCategory.keys(), ...monthBudgets.map((b) => b.category)]),
  ].filter((c) => !budgetCategoryOrder.includes(c));

  return [...budgetCategoryOrder, ...extras].map((category) => {
    const budget = monthBudgets.find((b) => b.category === category);
    const spent = spentByCategory.get(category) ?? 0;

    if (!budget) {
      return {
        category,
        limit: null,
        spent,
        remaining: null,
        percentUsed: null,
        status: "unset" as const,
      };
    }

    const percentUsed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    return {
      category,
      budgetId: budget.id,
      limit: budget.limit,
      spent,
      remaining: budget.limit - spent,
      percentUsed,
      status: getStatus(percentUsed),
    };
  });
}

/**
 * The summary shown above the cards.
 *
 * Total Budget counts only categories that actually have a limit.
 * Total Spent counts every expense this month, so it matches the donut
 * chart exactly — one number, not two that disagree.
 */
export function getBudgetTotals(lines: BudgetLine[]) {
  const totalBudget = lines.reduce((sum, l) => sum + (l.limit ?? 0), 0);
  const totalSpent = lines.reduce((sum, l) => sum + l.spent, 0);
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    totalBudget,
    totalSpent,
    remaining: totalBudget - totalSpent,
    percentUsed,
    status: totalBudget > 0 ? getStatus(percentUsed) : ("unset" as const),
    budgetedCount: lines.filter((l) => l.limit !== null).length,
  };
}

/* ---------- Data for the donut chart ---------- */

export type SpendingSlice = {
  /** The category, or null for the folded-together remainder. */
  category: ExpenseCategory | null;
  label: string;
  amount: number;
  /** Share of the month's total spending, 0-100. */
  percent: number;
};

/**
 * This month's expenses, biggest first, ready to draw.
 *
 * Only the largest `maxSlices` categories get their own segment; the rest
 * are folded into one grey "Other categories" slice. A donut with a dozen
 * slivers is unreadable, and the colour palette is only validated for
 * seven distinct hues.
 */
export function getSpendingBreakdown(
  transactions: Transaction[],
  range: MonthRange,
  maxSlices = 7,
): { slices: SpendingSlice[]; total: number } {
  const spentByCategory = getSpentByCategory(transactions, range);

  const sorted = [...spentByCategory]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const total = sorted.reduce((sum, [, amount]) => sum + amount, 0);
  if (total === 0) return { slices: [], total: 0 };

  const named = sorted.slice(0, maxSlices);
  const rest = sorted.slice(maxSlices);

  const slices: SpendingSlice[] = named.map(([category, amount]) => ({
    category,
    label: category,
    amount,
    percent: (amount / total) * 100,
  }));

  if (rest.length > 0) {
    const amount = rest.reduce((sum, [, value]) => sum + value, 0);
    slices.push({
      category: null,
      label: `Other categories (${rest.length})`,
      amount,
      percent: (amount / total) * 100,
    });
  }

  return { slices, total };
}
