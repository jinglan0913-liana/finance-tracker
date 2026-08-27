import { createClient } from "@supabase/supabase-js";

/*
  The connection to Supabase.

  Both values come from environment variables, never from this file — that
  is why there are no keys written here. Next.js replaces anything starting
  with NEXT_PUBLIC_ at build time, so these two reach the browser, which is
  exactly what the anon key is designed for.

  The service_role key must NEVER appear in this project. It ignores all
  database rules, and anything in the browser can be read by anyone.
*/

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until you have filled in .env.local — the app shows setup help. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/*
  When the keys are missing we still create a client, pointed at a dummy
  address, so importing this file never crashes. Nothing calls it, because
  the app shows the setup screen instead.
*/
export const supabase = createClient(
  url ?? "https://not-configured.supabase.co",
  anonKey ?? "not-configured",
);
