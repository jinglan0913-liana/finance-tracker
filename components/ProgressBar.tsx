import type { BudgetStatus } from "@/lib/budget";

/** Colour per status, shared by the bars and the labels. */
export const statusColor: Record<BudgetStatus, { bar: string; text: string }> = {
  unset: { bar: "bg-line", text: "text-faint" },
  normal: { bar: "bg-accent", text: "text-muted" },
  warning: { bar: "bg-amber-400", text: "text-amber-400" },
  over: { bar: "bg-negative", text: "text-negative" },
};

/** A thin bar showing how much of a budget is used. */
export default function ProgressBar({
  percent,
  status,
}: {
  percent: number;
  status: BudgetStatus;
}) {
  // The bar itself stops at 100% even when spending doesn't — the
  // "over budget" text carries that message instead.
  const width = Math.min(Math.max(percent, 0), 100);

  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full bg-elevated"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all ${statusColor[status].bar}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
