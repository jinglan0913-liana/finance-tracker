import type { Metadata } from "next";
import ErrorBanner from "@/components/ErrorBanner";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "./auth-provider";
import { FinanceProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "A simple personal finance dashboard",
};

/*
  This layout wraps every page in the app.

  AuthProvider is outermost: if nobody is signed in it shows the login
  screen and nothing below it is rendered at all.

  Inside it, FinanceProvider holds the accounts and transactions, so every
  page reads the same data. The sidebar is rendered here too, so it stays
  put while pages change.
*/
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <FinanceProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              {/* Shows only when a save fails. */}
              <ErrorBanner />
              {children}
            </main>
          </div>
          </FinanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
