import type { Currency } from "./types";

/** Small formatting helpers, shared by every page. */

export function formatCurrency(
  amount: number,
  currency: Currency = "USD",
  showSign = false,
): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    // "narrowSymbol" gives us "$" and "¥" instead of "US$" and "CN¥".
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (showSign) return `${amount < 0 ? "−" : "+"}${formatted}`;
  return amount < 0 ? `−${formatted}` : formatted;
}

/** "2026-08-14" -> "Aug 14" */
export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
