import { toUsd } from "./currency";
import {
  getCurrentMonthKey,
  getRangeForMonth,
  isInRange,
  type MonthRange,
} from "./dates";
import type { Account, Currency, Transaction } from "./types";

/*
  Every number shown in the app is calculated here.

  These are all PURE FUNCTIONS: you pass in a list, you get a number back.
  They never read the data themselves. That matters now that the real list
  lives in the provider and changes as you use the app — the pages pass in
  the current list, so every total is always up to date.
*/

/* ---------- Account totals ---------- */

/** Adds up a list of accounts, converting everything to USD first. */
export function sumInUsd(list: Account[]): number {
  return list.reduce((sum, a) => sum + toUsd(a.balance, a.currency), 0);
}

/** One subtotal per currency, e.g. [{ currency: "USD", total: 19775.73 }, ...] */
export function totalsByCurrency(
  list: Account[],
): { currency: Currency; total: number }[] {
  const totals = new Map<Currency, number>();
  for (const account of list) {
    totals.set(
      account.currency,
      (totals.get(account.currency) ?? 0) + account.balance,
    );
  }
  return [...totals].map(([currency, total]) => ({ currency, total }));
}

/** True when a list holds more than one currency, so totals are estimates. */
export function hasMixedCurrencies(list: Account[]): boolean {
  return new Set(list.map((a) => a.currency)).size > 1;
}

/* ---------- This month's figures ---------- */

/**
 * Income, expenses and what you kept for one calendar month, in USD.
 *
 * The month defaults to the current one, but the pages pass in whichever
 * month the selector is showing — the maths is identical either way.
 *
 * Transfers are skipped on purpose: moving your own money between your own
 * accounts is not earning and not spending, so they can never change
 * income, expenses or the amount saved.
 */
export function getMonthlySummary(
  transactions: Transaction[],
  range: MonthRange = getRangeForMonth(getCurrentMonthKey()),
) {
  // Older transactions are kept in the data — they are just not counted here.
  const inMonth = transactions.filter((t) => isInRange(t.date, range));

  const income = inMonth
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + toUsd(t.amount, t.currency), 0);

  const expenses = inMonth
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + toUsd(t.amount, t.currency), 0);

  const saved = income - expenses;
  const savingsRate = income > 0 ? (saved / income) * 100 : 0;

  return { income, expenses, saved, savingsRate, range };
}
