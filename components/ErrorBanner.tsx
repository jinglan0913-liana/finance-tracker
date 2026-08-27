"use client";

import { useFinance } from "@/app/providers";
import { CloseIcon } from "./icons";

/**
 * A single strip at the top of the page whenever a save fails. It is the
 * only place errors are shown, so no page has to handle them itself.
 */
export default function ErrorBanner() {
  const { error, dismissError } = useFinance();
  if (!error) return null;

  return (
    <div className="flex items-start gap-3 border-b border-negative/30 bg-negative/10 px-8 py-3">
      <div className="flex-1">
        <p className="text-sm text-negative">Couldn&apos;t save your change</p>
        <p className="mt-0.5 text-xs text-faint">
          {error} — your data has been reloaded from Supabase.
        </p>
      </div>
      <button
        type="button"
        onClick={dismissError}
        aria-label="Dismiss"
        className="rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-ink"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
