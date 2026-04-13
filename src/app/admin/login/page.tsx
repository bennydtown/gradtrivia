"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Wrong password");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--accent)]">
        Admin
      </h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="text-sm text-[var(--muted)]">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-[var(--muted)]/30 bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none ring-[var(--accent)]/40 focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p className="text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-[var(--bg)]"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
