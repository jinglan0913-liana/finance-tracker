"use client";

import { currencyLabel } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import type { Account, AccountType } from "@/lib/types";
import { BankIcon, CashIcon, PencilIcon, WalletIcon } from "./icons";

/** A small colour accent and icon per account type, so cards are easy to scan. */
const typeStyle: Record<
  AccountType,
  { accent: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
> = {
  Checking: { accent: "bg-accent/15 text-accent", Icon: BankIcon },
  Savings: { accent: "bg-positive/15 text-positive", Icon: BankIcon },
  Cash: { accent: "bg-emerald-400/15 text-emerald-400", Icon: CashIcon },
  Wallet: { accent: "bg-sky-400/15 text-sky-400", Icon: WalletIcon },
  "Credit Card": { accent: "bg-negative/15 text-negative", Icon: BankIcon },
  Investment: { accent: "bg-amber-400/15 text-amber-400", Icon: BankIcon },
};

export default function AccountCard({
  account,
  onEdit,
}: {
  account: Account;
  /** Optional: when given, an edit button appears on the card. */
  onEdit?: () => void;
}) {
  const isDebt = account.balance < 0;
  const { accent, Icon } = typeStyle[account.type];

  return (
    <div className="group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line/80 hover:bg-elevated/40">
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted">
            {account.type}
          </span>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit account"
              aria-label={`Edit ${account.name}`}
              className="rounded-md p-1 text-faint transition-colors hover:bg-elevated hover:text-ink focus-visible:text-ink"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3.5 truncate text-sm font-medium">{account.name}</p>
      <p className="truncate text-xs text-faint">
        {account.institution}
        {account.last4 && ` •••• ${account.last4}`}
      </p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <p
          className={`text-lg font-semibold tabular-nums ${
            isDebt ? "text-negative" : "text-ink"
          }`}
        >
          {formatCurrency(account.balance, account.currency)}
        </p>
        <span className="text-[11px] font-medium text-faint">
          {currencyLabel[account.currency]}
        </span>
      </div>
      {isDebt && <p className="text-xs text-faint">Amount owed</p>}
    </div>
  );
}
