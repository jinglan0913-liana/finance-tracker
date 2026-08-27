/*
  ============================================================
  THE ONE PLACE THAT KNOWS ABOUT CALENDAR MONTHS
  ============================================================

  Every "this month" question in the app is answered here, so the date
  rules are written once instead of being copied across pages.

  Two things this file is careful about:

  1. LOCAL TIME, NOT UTC.
     `new Date().toISOString()` gives you the date in UTC. If you're in
     New York at 8pm on Aug 31, UTC already thinks it's Sep 1 — so a
     transaction would land in the wrong month. Everything below builds
     dates from the local getFullYear/getMonth/getDate instead.

  2. COMPARING DATES AS TEXT.
     Our dates are stored as "2026-08-27". Because that format goes
     biggest-unit-first and is zero-padded, plain string comparison
     ("2026-08-27" >= "2026-08-01") is already correct date order — and
     it avoids the trap that `new Date("2026-08-01")` is parsed as UTC
     midnight, which can shift a day in your timezone.
*/

/**
 * Which month is being looked at. `month` is 0-11, the way JavaScript
 * counts months (0 = January, 11 = December).
 */
export type MonthKey = { year: number; month: number };

/** A span of days, stored the same way transactions store their dates. */
export type MonthRange = {
  /** First day included, e.g. "2026-08-01". */
  start: string;
  /** Last day included, e.g. "2026-08-31". */
  end: string;
  /** For headings, e.g. "August 2026". */
  label: string;
  /** For captions, e.g. "Aug 1 – Aug 31". */
  shortLabel: string;
};

/** Turns a Date into "2026-08-27" using LOCAL time, never UTC. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date, in the user's own timezone. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** The month we are in right now, according to the user's own clock. */
export function getCurrentMonthKey(): MonthKey {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/**
 * Steps forwards or backwards by whole months.
 *
 *   addMonths({ year: 2026, month: 11 }, 1)  ->  { year: 2027, month: 0 }
 *
 * We let the Date constructor do the hard part: given month 12 it rolls
 * over into January of the next year by itself, so December -> January
 * and January -> December need no special handling.
 */
export function addMonths(key: MonthKey, delta: number): MonthKey {
  const shifted = new Date(key.year, key.month + delta, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() };
}

/** A month as a short id, e.g. "2026-08". Used to tag month-specific data. */
export function toMonthId(key: MonthKey): string {
  return `${key.year}-${String(key.month + 1).padStart(2, "0")}`;
}

export function isSameMonth(a: MonthKey, b: MonthKey): boolean {
  return a.year === b.year && a.month === b.month;
}

/**
 * The first and last day of a month, as text dates.
 *
 * `new Date(year, month + 1, 0)` is the standard trick for "last day of
 * this month" — day zero of the next month. It gets February and leap
 * years right without any special cases.
 */
export function getRangeForMonth(key: MonthKey): MonthRange {
  const first = new Date(key.year, key.month, 1);
  const last = new Date(key.year, key.month + 1, 0);

  const short = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return {
    start: toIsoDate(first),
    end: toIsoDate(last),
    label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    shortLabel: `${short(first)} – ${short(last)}`,
  };
}

/** The whole calendar month containing a given date. */
export function getMonthRange(reference: Date = new Date()): MonthRange {
  return getRangeForMonth({
    year: reference.getFullYear(),
    month: reference.getMonth(),
  });
}

/** Is this date inside the range? Both ends are included. */
export function isInRange(isoDate: string, range: MonthRange): boolean {
  return isoDate >= range.start && isoDate <= range.end;
}

/** Keeps only the transactions dated inside the given month. */
export function filterByMonth<T extends { date: string }>(
  items: T[],
  range: MonthRange,
): T[] {
  return items.filter((item) => isInRange(item.date, range));
}
