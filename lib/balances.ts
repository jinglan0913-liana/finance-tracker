import type { Account, Transaction } from "./types";

/*
  The one place that decides how a transaction moves money.

  Keeping it here, as a plain function with no React in it, means the rule
  is written down exactly once and can be read (or tested) on its own.
*/

/** Rounds to cents, so repeated maths never leaves 0.1 + 0.2 style dust. */
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Returns the account with its new balance after the transaction.
 * If the transaction doesn't touch this account, it's returned untouched.
 *
 *   expense  -> money leaves   accountId
 *   income   -> money arrives  in accountId
 *   transfer -> money leaves   accountId
 *               and arrives in toAccountId
 */
export function applyTransaction(account: Account, t: Transaction): Account {
  const isSource = account.id === t.accountId;
  const isDestination = account.id === t.toAccountId;

  // This transaction has nothing to do with this account.
  if (!isSource && !isDestination) return account;

  let delta = 0;
  if (t.type === "expense" && isSource) delta = -t.amount;
  if (t.type === "income" && isSource) delta = t.amount;
  if (t.type === "transfer" && isSource) delta = -t.amount;
  if (t.type === "transfer" && isDestination) delta = t.amount;

  return { ...account, balance: toCents(account.balance + delta) };
}

/** Applies one transaction across a whole list of accounts. */
export function applyToAccounts(
  accounts: Account[],
  t: Transaction,
): Account[] {
  return accounts.map((account) => applyTransaction(account, t));
}
