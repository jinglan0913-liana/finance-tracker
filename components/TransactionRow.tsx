"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFinance } from "@/app/providers";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import { MoreIcon, PencilIcon, TrashIcon } from "./icons";

/** A coloured dot per category, so the list is scannable at a glance. */
const categoryDot: Record<Category, string> = {
  Income: "bg-positive",
  Transfer: "bg-blue-400",
  Housing: "bg-accent",
  Groceries: "bg-emerald-400",
  Dining: "bg-orange-400",
  Shopping: "bg-pink-400",
  Transportation: "bg-sky-400",
  Entertainment: "bg-fuchsia-400",
  Utilities: "bg-yellow-400",
  Subscriptions: "bg-violet-400",
  Pets: "bg-lime-400",
  Education: "bg-cyan-400",
  Travel: "bg-indigo-400",
  Healthcare: "bg-teal-400",
  Other: "bg-slate-400",
};

/*
  ------------------------------------------------------------
  WHY THE MENU IS A PORTAL AND NOT JUST AN ABSOLUTE DIV
  ------------------------------------------------------------
  The list of rows is wrapped in `overflow-hidden`, which is what makes
  the rounded corners actually clip the row backgrounds. But that clips
  EVERY descendant — so a dropdown hanging out of a row got cut off, and
  on the last row the Delete item was sliced away entirely.

  Moving the menu to document.body takes it out of that box completely.
  Nothing in the page layout can clip it, and it sits above everything
  else. The cost is that it no longer moves with the row on its own, so
  its position is measured from the button and refreshed while scrolling
  or resizing.
*/

/** Menu box size. Kept here because the flip-up maths needs to know it. */
const MENU_WIDTH = 160;
const MENU_HEIGHT = 84;
/** Breathing room from the button, and from the edges of the screen. */
const GAP = 6;
const EDGE = 8;

type Position = { top: number; left: number };

const menuItemClass =
  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors";

export default function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  /** Optional: when both are given, a three-dot actions menu appears. */
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  // Read account names from the shared data, so a renamed account
  // shows its new name here straight away.
  const { getAccount } = useFinance();
  const from = getAccount(transaction.accountId);
  const to = getAccount(transaction.toAccountId);

  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";

  const hasActions = onEdit !== undefined && onDelete !== undefined;

  // null means closed. Anything else is where the menu should be drawn.
  const [position, setPosition] = useState<Position | null>(null);
  const isMenuOpen = position !== null;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Works out where the menu goes, from wherever the button currently is.
   *
   * Right edges are lined up so the menu reads as belonging to the button.
   * It drops below by default and flips above when it would run off the
   * bottom of the screen, and it is kept inside the left/right edges so a
   * narrow phone never pushes it out of view.
   */
  const place = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();

    // Scrolled the row off the screen — the menu has nothing to point at.
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setPosition(null);
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const flipUp =
      spaceBelow < MENU_HEIGHT + GAP + EDGE && rect.top > MENU_HEIGHT + GAP + EDGE;

    const top = flipUp ? rect.top - MENU_HEIGHT - GAP : rect.bottom + GAP;
    const left = rect.right - MENU_WIDTH;

    setPosition({
      top: Math.max(EDGE, top),
      // Never let it hang off either side.
      left: Math.min(Math.max(EDGE, left), window.innerWidth - MENU_WIDTH - EDGE),
    });
  }, []);

  const closeMenu = useCallback(() => setPosition(null), []);

  /*
    Everything that should dismiss or move the menu, in one place.

    `pointerdown` rather than `mousedown` so a tap on a phone closes it
    just as a click does. Both refs are checked because the menu is no
    longer inside the row — clicking it would otherwise count as clicking
    "somewhere else" and close it before the button ever fired.

    Scroll is listened to in the capture phase so scrolling ANY container
    is caught, not just the window.
  */
  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointer(e: PointerEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      closeMenu();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isMenuOpen, place, closeMenu]);

  /** Runs one of the two actions and puts the menu away. */
  function choose(action: () => void) {
    closeMenu();
    action();
  }

  // "Groceries · BOA Checking", or "Chase Checking → Chase Savings"
  const detail = isTransfer
    ? `${from?.name ?? "Deleted account"} → ${to?.name ?? "Deleted account"}`
    : `${transaction.category} · ${from?.name ?? "Deleted account"}`;

  // Transfers show no +/−, because your total didn't actually change.
  const sign = isTransfer ? "" : isIncome ? "+" : "−";

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated/40">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${categoryDot[transaction.category]}`}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{transaction.description}</p>
        <p className="truncate text-xs text-faint">{detail}</p>
      </div>

      <span className="shrink-0 text-xs text-faint tabular-nums">
        {formatShortDate(transaction.date)}
      </span>

      <span
        className={`w-28 shrink-0 text-right text-sm font-medium tabular-nums ${
          isIncome ? "text-positive" : isTransfer ? "text-muted" : "text-ink"
        }`}
      >
        {sign}
        {formatCurrency(transaction.amount, transaction.currency)}
      </span>

      {/* The actions menu. Only on pages that can act on a transaction. */}
      {hasActions && (
        <>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => (isMenuOpen ? closeMenu() : place())}
            aria-label={`Actions for ${transaction.description}`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className={`shrink-0 rounded-md p-1.5 transition-colors hover:bg-elevated hover:text-ink ${
              isMenuOpen ? "bg-elevated text-ink" : "text-faint"
            }`}
          >
            <MoreIcon className="h-4 w-4" />
          </button>

          {/*
            Drawn straight onto document.body, so no overflow rule
            anywhere up the page can clip it. `fixed` matches the
            coordinates getBoundingClientRect gave us.
          */}
          {position &&
            createPortal(
              <div
                ref={menuRef}
                role="menu"
                aria-label="Transaction actions"
                style={{
                  top: position.top,
                  left: position.left,
                  width: MENU_WIDTH,
                }}
                className="fixed z-[100] overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-2xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  autoFocus
                  onClick={() => choose(onEdit)}
                  className={`${menuItemClass} text-ink hover:bg-elevated`}
                >
                  <PencilIcon className="h-4 w-4 text-muted" />
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => choose(onDelete)}
                  className={`${menuItemClass} text-negative hover:bg-negative/10`}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>,
              document.body,
            )}
        </>
      )}
    </div>
  );
}
