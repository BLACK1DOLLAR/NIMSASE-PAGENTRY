"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import GoldDivider from "@/components/GoldDivider";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      // Re-run the server component so it picks up the new session cookie.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-5 py-20">
      <div className="frame-card w-full px-8 py-10 text-center">
        <p className="eyebrow">Organizer Access</p>
        <h1 className="mt-3 font-display text-2xl text-ink-50">Admin Sign In</h1>
        <GoldDivider className="my-6" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-ink-300">Password</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
            />
          </div>
          {error && <p className="font-body text-sm text-burgundy-200">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-gold mt-2 w-full">
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </section>
  );
}
