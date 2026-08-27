"use client";

import { useFinance } from "@/app/providers";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/*
  ←  August 2026  →   [This Month]

  This component holds NO state of its own. It reads the selected month from
  the shared provider and calls back into it to change it. That is what lets
  the same component sit on two different pages and stay in step — both are
  looking at the same one piece of state.
*/

export default function MonthSelector() {
  const {
    selectedRange,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useFinance();

  const arrowClass =
    "rounded-md p-1.5 text-muted transition-colors hover:bg-elevated hover:text-ink";

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-line bg-surface px-1 py-1">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
          className={arrowClass}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {/* Fixed width stops the arrows shuffling as month names change length. */}
        <span className="min-w-[8.5rem] text-center text-sm font-medium">
          {selectedRange.label}
        </span>

        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Next month"
          className={arrowClass}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Disabled rather than hidden, so the row doesn't jump about. */}
      <button
        type="button"
        onClick={goToCurrentMonth}
        disabled={isCurrentMonth}
        className="rounded-lg border border-line px-2.5 py-2 text-xs text-muted transition-colors hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
      >
        This Month
      </button>
    </div>
  );
}
