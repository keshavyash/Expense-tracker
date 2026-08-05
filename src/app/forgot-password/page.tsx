"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-ink text-paper font-mono text-sm">
            ₹
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Reset password</h1>
          <p className="mt-1 text-sm text-ink-soft">
            We&apos;ll email you a link to set a new one.
          </p>
        </div>

        <div className="rounded-md border border-line bg-paper-raised p-6 shadow-sm">
          {sent ? (
            <>
              <p className="rounded-sm bg-common-soft px-3 py-2 text-sm text-common">
                Check your inbox for a reset link. It may take a minute to arrive.
              </p>
              <Link
                href="/login"
                className="mt-4 block text-center text-sm text-common hover:underline"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-4 block text-sm">
                <span className="mb-1 block text-ink-soft">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-sm border border-line bg-paper px-3 py-2 outline-none focus:border-ink"
                  placeholder="you@example.com"
                />
              </label>

              {error && (
                <p className="mb-3 rounded-sm bg-spouse-soft px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-sm bg-ink py-2.5 text-sm font-medium text-paper transition-std hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>

              <Link
                href="/login"
                className="mt-4 block text-center text-sm text-ink-soft hover:text-ink"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
