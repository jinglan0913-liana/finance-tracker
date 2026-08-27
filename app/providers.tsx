"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/app/auth-provider";
import { applyToAccounts } from "@/lib/balances";
import * as db from "@/lib/db";
import {
  addMonths,
  getCurrentMonthKey,
  getRangeForMonth,
  isSameMonth,
  toMonthId,
  type MonthKey,
  type MonthRange,
} from "@/lib/dates";
import type { Account, Budget, Transaction } from "@/lib/types";

/*
  ============================================================
  THE SINGLE SOURCE OF TRUTH
  ============================================================

  This still works exactly as it did before — every page reads the same
  accounts, transactions and budgets through useFinance(). One thing has
  changed: where that data comes from.

    before   a mock-data file, thrown away on every refresh
    now      Supabase, loaded once when the app opens — and only ever
             the rows belonging to the person who is signed in

  Each change is made in two places, in this order:

    1. update the copy on screen, so the app responds instantly
    2. save it to Supabase in the background

  If step 2 fails, the error banner appears and the data is re-loaded from
  Supabase, so what you see always matches what is actually stored.
*/

type FinanceValue = {
  accounts: Account[];
  transactions: Transaction[];
  saveAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  getAccount: (id: string | undefined) => Account | undefined;

  /* ---- Which month the reports are showing ---- */
  selectedMonth: MonthKey;
  selectedRange: MonthRange;
  isCurrentMonth: boolean;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  selectedMonthId: string;

  /* ---- Budgets ---- */
  budgets: Budget[];
  saveBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;

  /* ---- Talking to the database ---- */
  /** True while the first load is still running. */
  isLoading: boolean;
  /** The last thing that went wrong, or null. */
  error: string | null;
  dismissError: () => void;
};

const FinanceContext = createContext<FinanceValue | null>(null);

function messageFrom(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  // AuthProvider only renders this once someone is signed in, so there is
  // always a user here. Every row we write is stamped with their id.
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- Loading everything ---- */

  const loadAll = useCallback(async () => {
    try {
      // All three at once, rather than one after another.
      const [nextAccounts, nextTransactions, nextBudgets] = await Promise.all([
        db.fetchAccounts(),
        db.fetchTransactions(),
        db.fetchBudgets(),
      ]);
      setAccounts(nextAccounts);
      setTransactions(nextTransactions);
      setBudgets(nextBudgets);
      setError(null);
    } catch (e) {
      setError(messageFrom(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Runs once, when the app first opens.
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /**
   * Runs a save. If it fails, shows the message and re-loads from the
   * database so the screen never quietly disagrees with what is stored.
   */
  const persist = useCallback(
    async (work: () => Promise<void>) => {
      try {
        await work();
        setError(null);
      } catch (e) {
        setError(messageFrom(e));
        loadAll();
      }
    },
    [loadAll],
  );

  /* ---- Accounts ---- */

  function saveAccount(saved: Account) {
    setAccounts((current) => {
      const exists = current.some((a) => a.id === saved.id);
      if (exists) return current.map((a) => (a.id === saved.id ? saved : a));
      return [...current, saved];
    });
    persist(() => db.upsertAccount(saved, user.id));
  }

  function deleteAccount(id: string) {
    setAccounts((current) => current.filter((a) => a.id !== id));
    persist(() => db.deleteAccountRow(id));
  }

  /* ---- Transactions ---- */

  /*
    Adding a transaction still does TWO things together: it records the
    transaction and it moves the balances it affects. Both are now saved
    to Supabase in one step, so a refresh shows the same numbers.
  */
  function addTransaction(transaction: Transaction) {
    const updatedAccounts = applyToAccounts(accounts, transaction);

    // Only the one or two accounts that actually changed need saving.
    const changed = updatedAccounts.filter((account, i) => account !== accounts[i]);

    setTransactions((current) =>
      [transaction, ...current].sort((a, b) => b.date.localeCompare(a.date)),
    );
    setAccounts(updatedAccounts);

    persist(() => db.saveTransaction(transaction, changed, user.id));
  }

  function getAccount(id: string | undefined) {
    if (!id) return undefined;
    return accounts.find((a) => a.id === id);
  }

  /* ---- Budgets ---- */

  function saveBudget(saved: Budget) {
    setBudgets((current) => {
      // Match on month + category, the same rule the database enforces.
      const existing = current.find(
        (b) => b.month === saved.month && b.category === saved.category,
      );
      if (existing) {
        return current.map((b) => (b.id === existing.id ? { ...saved, id: existing.id } : b));
      }
      return [...current, saved];
    });
    persist(() => db.upsertBudget(saved, user.id));
  }

  function deleteBudget(id: string) {
    setBudgets((current) => current.filter((b) => b.id !== id));
    persist(() => db.deleteBudgetRow(id));
  }

  /* ---- The selected month (unchanged — this is screen state, not data) ---- */

  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(getCurrentMonthKey);

  const selectedRange = getRangeForMonth(selectedMonth);
  const isCurrentMonth = isSameMonth(selectedMonth, getCurrentMonthKey());
  const selectedMonthId = toMonthId(selectedMonth);

  const goToPreviousMonth = () => setSelectedMonth((c) => addMonths(c, -1));
  const goToNextMonth = () => setSelectedMonth((c) => addMonths(c, 1));
  const goToCurrentMonth = () => setSelectedMonth(getCurrentMonthKey());

  /* ---- What to show while connecting ---- */

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted">Loading your data…</p>
      </div>
    );
  }

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        saveAccount,
        deleteAccount,
        addTransaction,
        getAccount,
        selectedMonth,
        selectedRange,
        isCurrentMonth,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,
        selectedMonthId,
        budgets,
        saveBudget,
        deleteBudget,
        isLoading,
        error,
        dismissError: () => setError(null),
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

/** The hook every page uses to reach the shared data. */
export function useFinance(): FinanceValue {
  const value = useContext(FinanceContext);
  if (!value) {
    throw new Error("useFinance must be used inside <FinanceProvider>.");
  }
  return value;
}
