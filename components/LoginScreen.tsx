"use client";

import { useState } from "react";
import { getSiteUrl } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

/*
  Sign in and sign up on one screen, sharing the same two fields.
  `mode` decides which button is the main one and which call is made.
*/

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // On success the auth listener swaps this screen for the app.
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            // Send the confirmation link back to whichever site the user is
            // actually on — localhost in development, the real domain in
            // production. Without this Supabase always uses its configured
            // Site URL, which would bounce local sign-ups to production.
            emailRedirectTo: getSiteUrl(),
          },
        });
        if (error) throw error;

        // No session back means Supabase wants the email confirmed first.
        if (!data.session) {
          setNotice(
            "Account created. Check your email for the confirmation link, then sign in.",
          );
          setMode("signin");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink " +
    "outline-none transition-colors placeholder:text-faint focus:border-accent " +
    "disabled:opacity-60";

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-[13px] font-semibold text-white">
            F
          </div>
          <span className="text-sm font-semibold tracking-tight">Finance</span>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6">
          <h1 className="text-base font-medium">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {mode === "signin"
              ? "Your accounts, transactions and budgets are private to you."
              : "You'll use this to sign in from any device."}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                disabled={isSubmitting}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={fieldClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs text-muted"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                disabled={isSubmitting}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                className={fieldClass}
              />
            </div>

            {error && <p className="text-xs text-negative">{error}</p>}
            {notice && <p className="text-xs text-positive">{notice}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? mode === "signin"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "signin"
                  ? "Sign In"
                  : "Sign Up"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setNotice("");
            }}
            className="text-accent transition-opacity hover:opacity-80"
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
