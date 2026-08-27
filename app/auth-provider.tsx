"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import LoginScreen from "@/components/LoginScreen";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/*
  ============================================================
  WHO IS LOGGED IN
  ============================================================

  This sits OUTSIDE everything else. If nobody is signed in it renders
  the login screen instead of its children — so the sidebar, Dashboard,
  Accounts, Transactions and Budget are never even built, let alone shown.

  Supabase keeps the session in the browser's local storage and refreshes
  it in the background, which is why closing the tab and coming back later
  does not log you out.
*/

type AuthValue = {
  user: User;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // True until we know whether there is a saved session. Without this the
  // login screen would flash for a moment on every page load.
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsChecking(false);
      return;
    }

    // 1. Is there a session saved from last time?
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsChecking(false);
    });

    // 2. Keep listening — this fires on sign in, sign out and token refresh.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => setSession(nextSession),
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return <SetupNotice />;

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted">Checking your session…</p>
      </div>
    );
  }

  // Signed out: the app below this line never renders.
  if (!session) return <LoginScreen />;

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {/*
        Keying on the user id throws away all loaded finance data if a
        different person signs in, so one account's numbers can never
        linger on screen for another.
      */}
      <div key={session.user.id} className="contents">
        {children}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}
