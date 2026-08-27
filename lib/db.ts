import { supabase } from "./supabase";
import type {
  Account,
  AccountType,
  Budget,
  Category,
  Currency,
  ExpenseCategory,
  Transaction,
  TransactionType,
} from "./types";

/*
  ============================================================
  EVERY CONVERSATION WITH THE DATABASE HAPPENS IN THIS FILE
  ============================================================

  Two small differences between the database and the app live here, and
  nowhere else, so the rest of the code never has to think about them:

    1. NAMES. The database uses snake_case ("account_id", "monthly_limit")
       because that is the SQL convention. The app uses camelCase
       ("accountId", "limit"). The row<->object functions below translate.

    2. OWNERSHIP. Every row carries the user_id of whoever created it.
       The database refuses any row whose user_id is not the logged-in
       user, so this is not merely a filter — it is enforced below you.

    3. TRANSFERS. The database keeps the two sides of a transfer in
       from_account_id / to_account_id, and uses account_id for ordinary
       expenses and income. The app has always used accountId as "the
       account, or the one it came from", so the mapping happens here too.

  Every function throws if Supabase reports a problem. The provider catches
  that and shows the message.
*/

/** Turns a Supabase error into a normal thrown Error. */
function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/* ---------------- Accounts ---------------- */

type AccountRow = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number | string;
  institution: string;
  last4: string;
};

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as AccountType,
    currency: row.currency as Currency,
    // numeric columns can arrive as text, so always coerce.
    balance: Number(row.balance),
    institution: row.institution ?? "",
    last4: row.last4 ?? "",
  };
}

function accountToRow(account: Account, userId: string) {
  return {
    id: account.id,
    // Who this row belongs to. RLS rejects it if this isn't you.
    user_id: userId,
    name: account.name,
    type: account.type,
    currency: account.currency,
    balance: account.balance,
    institution: account.institution,
    last4: account.last4,
  };
}

/* The three fetches take no user id on purpose: the database only ever
   returns rows belonging to whoever is logged in. */

export async function fetchAccounts(): Promise<Account[]> {
  const rows = check(
    await supabase.from("accounts").select("*").order("created_at"),
  );
  return (rows as AccountRow[]).map(rowToAccount);
}

/** Inserts a new account, or overwrites the existing one with the same id. */
export async function upsertAccount(
  account: Account,
  userId: string,
): Promise<void> {
  check(
    await supabase.from("accounts").upsert(accountToRow(account, userId)).select(),
  );
}

/** Saves several accounts at once — used when a transfer moves two balances. */
export async function upsertAccounts(
  accounts: Account[],
  userId: string,
): Promise<void> {
  if (accounts.length === 0) return;
  check(
    await supabase
      .from("accounts")
      .upsert(accounts.map((a) => accountToRow(a, userId)))
      .select(),
  );
}

export async function deleteAccountRow(id: string): Promise<void> {
  check(await supabase.from("accounts").delete().eq("id", id).select());
}

/* ---------------- Transactions ---------------- */

type TransactionRow = {
  id: string;
  name: string;
  date: string;
  type: string;
  category: string;
  amount: number | string;
  currency: string;
  account_id: string | null;
  from_account_id: string | null;
  to_account_id: string | null;
};

function rowToTransaction(row: TransactionRow): Transaction {
  const isTransfer = row.type === "transfer";
  return {
    id: row.id,
    description: row.name,
    date: row.date,
    type: row.type as TransactionType,
    category: row.category as Category,
    amount: Number(row.amount),
    currency: row.currency as Currency,
    // A transfer's "from" side is the app's accountId.
    accountId: (isTransfer ? row.from_account_id : row.account_id) ?? "",
    ...(isTransfer && row.to_account_id
      ? { toAccountId: row.to_account_id }
      : {}),
  };
}

function transactionToRow(t: Transaction, userId: string) {
  const isTransfer = t.type === "transfer";
  return {
    id: t.id,
    user_id: userId,
    name: t.description,
    date: t.date,
    type: t.type,
    category: t.category,
    amount: t.amount,
    currency: t.currency,
    // Expense and income use account_id; transfers use the from/to pair.
    account_id: isTransfer ? null : t.accountId,
    from_account_id: isTransfer ? t.accountId : null,
    to_account_id: isTransfer ? (t.toAccountId ?? null) : null,
  };
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const rows = check(
    await supabase.from("transactions").select("*").order("date", { ascending: false }),
  );
  return (rows as TransactionRow[]).map(rowToTransaction);
}

/**
 * Saves a transaction AND the balances it changed.
 *
 * The transaction is written first: if the balance update then fails, you
 * end up with a saved transaction and stale balances, which the app can
 * spot and correct. The other order would lose the transaction entirely.
 */
export async function saveTransaction(
  transaction: Transaction,
  changedAccounts: Account[],
  userId: string,
): Promise<void> {
  check(
    await supabase
      .from("transactions")
      .insert(transactionToRow(transaction, userId))
      .select(),
  );
  await upsertAccounts(changedAccounts, userId);
}

/* ---------------- Budgets ---------------- */

type BudgetRow = {
  id: string;
  month: string;
  category: string;
  monthly_limit: number | string;
};

function rowToBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    month: row.month,
    category: row.category as ExpenseCategory,
    limit: Number(row.monthly_limit),
  };
}

export async function fetchBudgets(): Promise<Budget[]> {
  const rows = check(
    await supabase.from("budgets").select("*").order("created_at"),
  );
  return (rows as BudgetRow[]).map(rowToBudget);
}

/**
 * Saves one month's limit for one category.
 *
 * Setting Groceries for August twice updates the same row instead of
 * creating a duplicate — and never touches September, or anyone else.
 */
export async function upsertBudget(
  budget: Budget,
  userId: string,
): Promise<void> {
  check(
    await supabase
      .from("budgets")
      .upsert(
        {
          id: budget.id,
          user_id: userId,
          month: budget.month,
          category: budget.category,
          monthly_limit: budget.limit,
        },
        // Matches the UNIQUE rule in add-auth.sql: one budget per user,
        // per month, per category.
        { onConflict: "user_id,month,category" },
      )
      .select(),
  );
}

export async function deleteBudgetRow(id: string): Promise<void> {
  check(await supabase.from("budgets").delete().eq("id", id).select());
}
