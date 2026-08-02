"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || email.split("@")[0] } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setNotice("Account created. Check your email to confirm, then sign in.");
      setMode("sign-in");
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-ink text-paper font-mono text-sm">
            ₹
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Ledger</h1>
          <p className="mt-1 text-sm text-ink-soft">Your shared household ledger</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-line bg-paper-raised p-6 shadow-sm"
        >
          <div className="mb-4 flex rounded-sm border border-line p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`flex-1 rounded-sm py-1.5 transition-std ${
                mode === "sign-in" ? "bg-ink text-paper" : "text-ink-soft"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className={`flex-1 rounded-sm py-1.5 transition-std ${
                mode === "sign-up" ? "bg-ink text-paper" : "text-ink-soft"
              }`}
            >
              Create account
            </button>
          </div>

          {mode === "sign-up" && (
            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-ink-soft">Your name</span>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-sm border border-line bg-paper px-3 py-2 outline-none focus:border-ink"
                placeholder="e.g. Yash"
              />
            </label>
          )}

          <label className="mb-3 block text-sm">
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

          <label className="mb-4 block text-sm">
            <span className="mb-1 block text-ink-soft">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-line bg-paper px-3 py-2 outline-none focus:border-ink"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="mb-3 rounded-sm bg-spouse-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          {notice && (
            <p className="mb-3 rounded-sm bg-common-soft px-3 py-2 text-sm text-common">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-ink py-2.5 text-sm font-medium text-paper transition-std hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
