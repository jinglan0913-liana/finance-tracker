import type { Account, Transaction } from "./types";

/*
  The one place that decides how a transaction moves money.

  Keeping it here, as a plain function with no React in it, means the rule
  is written down exactly once and can be read (or tested) on its own.

  The same rule is also written in SQL, in supabase/add-transaction-rpc.sql,
  where the saved balances are actually changed. This copy exists so the
  screen can respond the instant you click, before the database has
  answered — and the database's answer is what the app keeps.
*/

/** Rounds to cents, so repeated maths never leaves 0.1 + 0.2 style dust. */
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * How much this transaction adds to (or takes from) this one account.
 * Zero when the transaction has nothing to do with it.
 *
 *   expense  -> money leaves   accountId
 *   income   -> money arrives  in accountId
 *   transfer -> money leaves   accountId
 *               and arrives in toAccountId
 */
function deltaFor(account: Account, t: Transaction): number {
  const isSource = account.id === t.accountId;
  const isDestination = account.id === t.toAccountId;

  if (t.type === "expense" && isSource) return -t.amount;
  if (t.type === "income" && isSource) return t.amount;
  if (t.type === "transfer" && isSource) return -t.amount;
  if (t.type === "transfer" && isDestination) return t.amount;
  return 0;
}

/**
 * Returns the account with its new balance after the transaction.
 * If the transaction doesn't touch this account, it's returned untouched.
 */
export function applyTransaction(account: Account, t: Transaction): Account {
  const delta = deltaFor(account, t);
  if (delta === 0) return account;
  return { ...account, balance: toCents(account.balance + delta) };
}

/**
 * The exact opposite: puts back whatever the transaction took, and takes
 * back whatever it gave. Deleting a $100 expense gives the $100 back;
 * deleting a $1,000 income takes the $1,000 away again.
 *
 * Reversing is not a separate rule — it is the same arithmetic with the
 * sign flipped, which is what stops the two from ever disagreeing.
 */
export function revertTransaction(account: Account, t: Transaction): Account {
  const delta = deltaFor(account, t);
  if (delta === 0) return account;
  return { ...account, balance: toCents(account.balance - delta) };
}

/** Applies one transaction across a whole list of accounts. */
export function applyToAccounts(
  accounts: Account[],
  t: Transaction,
): Account[] {
  return accounts.map((account) => applyTransaction(account, t));
}

/** Reverses one transaction across a whole list of accounts. */
export function revertFromAccounts(
  accounts: Account[],
  t: Transaction,
): Account[] {
  return accounts.map((account) => revertTransaction(account, t));
}

/**
 * What an edit does to the balances: reverse the OLD transaction, then
 * apply the NEW one. Never an overwrite.
 *
 *   $100 expense on Chase  ->  $80 expense on BOA
 *     Chase + $100   (the old one, undone)
 *     BOA   -  $80   (the new one, applied)
 *
 * Changing the type needs no extra code — reversing a $500 income and
 * applying a $100 expense is these same two steps.
 */
export function applyEdit(
  accounts: Account[],
  before: Transaction,
  after: Transaction,
): Account[] {
  return applyToAccounts(revertFromAccounts(accounts, before), after);
}
