/**
 * Where Supabase should send people back to after they click a link in a
 * confirmation email.
 *
 * This is read from the browser at the moment it is needed, rather than
 * being written down anywhere. That is what lets the same build work on
 * localhost and on a Vercel domain without a code change:
 *
 *   http://localhost:3000        while you are developing
 *   https://your-app.vercel.app  once deployed
 *   https://preview-xyz.vercel.app  on a preview deployment
 *
 * Supabase will only actually redirect to addresses you have allow-listed
 * under Authentication -> URL Configuration, so this cannot be abused to
 * send your users somewhere else.
 */
export function getSiteUrl(): string | undefined {
  // Undefined during server rendering, where there is no window.
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}
