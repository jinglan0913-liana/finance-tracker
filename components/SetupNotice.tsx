/**
 * Shown instead of the app when the Supabase keys are missing, so a fresh
 * checkout explains itself rather than showing a blank screen or a crash.
 */
export default function SetupNotice() {
  return (
    <div className="flex h-screen items-center justify-center p-8">
      <div className="max-w-md rounded-xl border border-line bg-surface p-6">
        <h1 className="text-base font-medium">Connect Supabase to continue</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The app stores your data in Supabase, and it can&apos;t find the
          connection details yet.
        </p>

        <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-sm text-muted">
          <li>
            Create a project at{" "}
            <span className="text-ink">supabase.com</span>.
          </li>
          <li>
            Run <span className="text-ink">supabase/schema.sql</span> in the
            SQL Editor.
          </li>
          <li>
            Copy <span className="text-ink">.env.local.example</span> to{" "}
            <span className="text-ink">.env.local</span> and fill in your
            project URL and anon key.
          </li>
          <li>
            Restart the dev server (
            <span className="text-ink">npm run dev</span>).
          </li>
        </ol>

        <p className="mt-4 text-xs leading-relaxed text-faint">
          Environment variables are only read when the server starts, so the
          restart in step 4 matters.
        </p>
      </div>
    </div>
  );
}
