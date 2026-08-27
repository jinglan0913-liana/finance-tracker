"use client";

import type { BudgetLine } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { PencilIcon } from "./icons";
import ProgressBar, { statusColor } from "./ProgressBar";

/*
  One category's card. Always shown, whether or not a budget exists.

    budget set   Groceries              44%
                 $220.00 spent   $500.00 budget
                 [====------]
                 $280.00 remaining

    over budget  Shopping              133%
                 $530.00 spent   $400.00 budget
                 [==========]
                 $130.00 over budget

    no budget    Pets                     —
                 $0.00 spent          Not set
                 [----------]
                 Set budget

  The whole card is a button, so clicking anywhere opens the editor. There
  is only ever ONE edit affordance on a card: the pencil once a budget
  exists, or the "Set budget" prompt before that — never both.
*/
export default function BudgetCard({
  line,
  onEdit,
}: {
  line: BudgetLine;
  onEdit: () => void;
}) {
  const hasBudget = line.limit !== null;
  const isOver = line.status === "over";

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={
        hasBudget
          ? `Edit ${line.category} budget`
          : `Set ${line.category} budget`
      }
      className={`group rounded-xl border bg-surface p-3 text-left transition-colors hover:bg-elevated/40 ${
        isOver ? "border-negative/40" : "border-line hover:border-accent/40"
      }`}
    >
      {/* Name and percentage used */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium">{line.category}</p>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`text-sm font-semibold tabular-nums ${statusColor[line.status].text}`}
          >
            {hasBudget ? `${line.percentUsed!.toFixed(1)}%` : "—"}
          </span>
          {/* Shown only when there is a budget to edit — otherwise the
              "Set budget" prompt below is the single call to action. */}
          {hasBudget && (
            <PencilIcon className="h-3.5 w-3.5 text-faint transition-colors group-hover:text-ink" />
          )}
        </div>
      </div>

      {/* Spent and budget, side by side */}
      <div className="mt-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate tabular-nums text-muted">
          {formatCurrency(line.spent)} spent
        </span>
        <span className="shrink-0 tabular-nums text-faint">
          {hasBudget ? `${formatCurrency(line.limit!)} budget` : "Not set"}
        </span>
      </div>

      <div className="mt-2">
        <ProgressBar percent={line.percentUsed ?? 0} status={line.status} />
      </div>

      {/* What's left, or how far past the limit */}
      <p className="mt-1.5 truncate text-xs font-medium">
        {!hasBudget ? (
          <span className="text-accent">Set budget</span>
        ) : isOver ? (
          <span className="text-negative">
            {formatCurrency(Math.abs(line.remaining!))} over budget
          </span>
        ) : (
          <span className="text-muted">
            {formatCurrency(line.remaining!)} remaining
          </span>
        )}
      </p>
    </button>
  );
}
