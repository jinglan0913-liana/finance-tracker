import type { Currency } from "./types";

/**
 * Multi-currency support, kept as simple as possible.
 *
 * IMPORTANT: this rate is hard-coded, not live. We are not calling any
 * exchange-rate API yet. Whenever a total mixes currencies, the UI says
 * "estimated" so the number is never mistaken for an exact figure.
 *
 * To change the rate, edit this one number.
 */
export const CNY_PER_USD = 7.1;

/** Human-friendly label. RMB is the everyday name for the CNY currency. */
export const currencyLabel: Record<Currency, string> = {
  USD: "USD",
  CNY: "RMB",
};

/** Converts any supported currency into USD, so totals can be added up. */
export function toUsd(amount: number, currency: Currency): number {
  if (currency === "USD") return amount;
  return amount / CNY_PER_USD;
}
