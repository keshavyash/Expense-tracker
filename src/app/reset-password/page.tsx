"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(
        error.message.includes("session")
          ? "This reset link has expired or already been used. Request a new one from the login page."
          : error.message
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-ink text-paper font-mono text-sm">
            ₹
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Set a new password</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-line bg-paper-raised p-6 shadow-sm"
        >
          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-ink-soft">New password</span>
            <PasswordInput
              value={password}
              onChange={setPassword}
              required
              minLength={6}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>

          <label className="mb-4 block text-sm">
            <span className="mb-1 block text-ink-soft">Confirm password</span>
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              minLength={6}
              placeholder="••••••••"
              autoComplete="new-password"
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
            {loading ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </main>
  );
}
