"use client";

import { useState } from "react";
import type { SpendingSlice } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";

/*
  A donut chart drawn with plain SVG — no chart library.

  The trick: each segment is a full circle with a dashed outline. By setting
  the dash to "draw this many pixels, then skip the rest", and offsetting
  where the dash starts, each circle draws exactly one arc.
*/

/*
  Seven fixed hues, in this order, plus grey for the folded remainder.
  These are stepped for a dark surface and checked for colour-blind
  separation — don't reorder or substitute them casually.
*/
const SLICE_COLORS = [
  "#3987e5", // blue
  "#d95926", // orange
  "#199e70", // aqua
  "#c98500", // yellow
  "#d55181", // magenta
  "#008300", // green
  "#9085e9", // violet
];
const OTHER_COLOR = "#6b6b76"; // grey — never one of the seven hues

const SIZE = 148;
const RADIUS = 58;
const THICKNESS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** A small gap so neighbouring segments never blur into one another. */
const GAP = 3;

function colorFor(slice: SpendingSlice, index: number): string {
  return slice.category === null ? OTHER_COLOR : SLICE_COLORS[index % SLICE_COLORS.length];
}

export default function DonutChart({
  slices,
  total,
  monthLabel,
}: {
  slices: SpendingSlice[];
  total: number;
  monthLabel: string;
}) {
  // Hovering a segment or a legend row focuses that category.
  const [active, setActive] = useState<number | null>(null);
  const focused = active !== null ? slices[active] : null;

  const isEmpty = slices.length === 0;

  // Where each arc starts, measured around the ring.
  let cursor = 0;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-base font-medium">This Month&apos;s Expenses</h2>
      <p className="mt-0.5 text-xs text-faint">{monthLabel}</p>

      <div className="mt-5 flex justify-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={
              isEmpty
                ? `No expenses in ${monthLabel}`
                : `Expenses by category for ${monthLabel}`
            }
          >
            {/* Track. On its own when there is nothing to show. */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--color-elevated)"
              strokeWidth={THICKNESS}
            />

            {/* Rotated so the first segment starts at 12 o'clock. */}
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              {slices.map((slice, i) => {
                const length = (slice.percent / 100) * CIRCUMFERENCE;
                const drawn = Math.max(length - GAP, 0.5);
                const offset = cursor;
                cursor += length;

                const dimmed = active !== null && active !== i;

                return (
                  <circle
                    key={slice.label}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={colorFor(slice, i)}
                    strokeWidth={active === i ? THICKNESS + 4 : THICKNESS}
                    strokeDasharray={`${drawn} ${CIRCUMFERENCE - drawn}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                    opacity={dimmed ? 0.35 : 1}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                  />
                );
              })}
            </g>
          </svg>

          {/* The number in the hole: the total, or whatever is hovered. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {isEmpty ? (
              <>
                <p className="text-sm text-muted">No expenses</p>
                <p className="mt-0.5 text-xs text-faint">yet</p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold tabular-nums">
                  {formatCurrency(focused ? focused.amount : total)}
                </p>
                <p className="mt-0.5 max-w-[6rem] truncate text-center text-xs text-faint">
                  {focused ? focused.label : "Total Spent"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend. Identity is never colour alone — every row is named. */}
      {isEmpty ? (
        <p className="mt-5 text-center text-xs leading-relaxed text-faint">
          Add an expense on the Transactions page and it will appear here,
          broken down by category.
        </p>
      ) : (
        <>
        <p className="mt-5 mb-2 text-xs text-muted">Top categories</p>
        <ul className="flex flex-col gap-1.5">
          {slices.map((slice, i) => (
            <li key={slice.label}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-elevated/60 ${
                  active !== null && active !== i ? "opacity-50" : ""
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: colorFor(slice, i) }}
                />
                <span className="min-w-0 flex-1 truncate text-xs">
                  {slice.label}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {formatCurrency(slice.amount)}
                </span>
                <span className="w-11 shrink-0 text-right text-xs tabular-nums text-faint">
                  {slice.percent.toFixed(1)}%
                </span>
              </button>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
