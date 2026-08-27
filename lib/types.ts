// All the shapes of data used in the app live here.
// Later, when you add a real database, only the code that *produces*
// these objects has to change — the UI can stay exactly the same.

/** The currencies the app understands. Add more here when you need them. */
export type Currency = "USD" | "CNY";

export type AccountType =
  | "Checking"
  | "Savings"
  | "Cash"
  | "Wallet"
  | "Credit Card"
  | "Investment";

export type Account = {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  /** Positive for money you own, negative for money you owe (credit cards). */
  balance: number;
  /** The currency `balance` is measured in. */
  currency: Currency;
  /** Last 4 digits, purely cosmetic. Empty string for cash/wallets. */
  last4: string;
};

/**
 * What a transaction did with the money.
 *  - expense  : money left one account
 *  - income   : money arrived in one account
 *  - transfer : money moved between two of your own accounts.
 *               A transfer is NOT income and NOT an expense — you still
 *               own the money, it just sits somewhere else now.
 */
export type TransactionType = "expense" | "income" | "transfer";

/**
 * The categories money can be spent on. These are the ONLY categories a
 * budget can be set for — income and transfers are not spending.
 */
export type ExpenseCategory =
  | "Housing"
  | "Groceries"
  | "Dining"
  | "Shopping"
  | "Transportation"
  | "Entertainment"
  | "Utilities"
  | "Subscriptions"
  | "Pets"
  | "Education"
  | "Travel"
  | "Healthcare"
  | "Other";

/** The same list as an array, for dropdowns and for looping over. */
export const expenseCategories: ExpenseCategory[] = [
  "Housing",
  "Groceries",
  "Dining",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Subscriptions",
  "Pets",
  "Education",
  "Travel",
  "Healthcare",
  "Other",
];

/**
 * The order budget cards appear in. These are exactly the transaction
 * expense categories — same names, no renaming, no merging — so a
 * transaction's category maps straight onto its budget card.
 *
 * A card is shown for every one of these whether or not a budget has been
 * set, so you never have to create a category before using it.
 */
export const budgetCategoryOrder: ExpenseCategory[] = [
  "Groceries",
  "Dining",
  "Housing",
  "Shopping",
  "Transportation",
  "Utilities",
  "Subscriptions",
  "Entertainment",
  "Pets",
  "Education",
  "Travel",
  "Healthcare",
  "Other",
];

/**
 * Every category a transaction can have: the spending ones above, plus the
 * two that are deliberately NOT spending.
 */
export type Category = ExpenseCategory | "Income" | "Transfer";

/** Categories offered for income. */
export const incomeCategories: Category[] = ["Income"];

export type Transaction = {
  id: string;
  /** ISO date string, e.g. "2026-08-14". */
  date: string;
  description: string;
  type: TransactionType;
  category: Category;
  /**
   * ALWAYS a positive number. The `type` above tells you which direction
   * the money went, so the amount itself never needs a minus sign.
   */
  amount: number;
  /** Copied from the account when the transaction is saved. */
  currency: Currency;
  /**
   * For expense and income: the account involved.
   * For a transfer: the account the money came FROM.
   */
  accountId: string;
  /** Transfers only: the account the money went TO. */
  toAccountId?: string;
};

/**
 * A spending limit for ONE category in ONE month.
 *
 * Budgets are stored per month, so August and September are separate rows
 * and editing one never touches the other.
 */
export type Budget = {
  id: string;
  /** Which month this applies to, as "2026-08". */
  month: string;
  category: ExpenseCategory;
  /** The monthly limit, in USD. Always positive. */
  limit: number;
};
