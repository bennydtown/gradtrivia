"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  formatLeaderScore,
  type LeaderboardRow,
} from "@/lib/leaderboard-types";

const GRAD_LABELS: Record<string, string> = {
  solie: "Solie",
  diego: "Diego",
  levi: "Levi",
  lars: "Lars",
  lucia: "Lucia",
};

export default function LeaderboardPage() {
  const [scope, setScope] = useState<"overall" | string>("overall");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  const load = useCallback(async () => {
    const q = scope === "overall" ? "overall" : scope;
    const res = await fetch(`/api/game/leaderboard?grad=${encodeURIComponent(q)}`);
    if (!res.ok) return;
    const data = (await res.json()) as { rows: LeaderboardRow[] };
    setRows(data.rows);
  }, [scope]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => void load(), 8000);
    return () => clearInterval(t);
  }, [load]);

  const gradKeys = Object.keys(GRAD_LABELS);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--accent)]">
          High scores
        </h1>
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
          Home
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-sm ${
            scope === "overall"
              ? "bg-[var(--accent)] text-[var(--bg)]"
              : "bg-[var(--surface)] text-[var(--muted)]"
          }`}
          onClick={() => setScope("overall")}
        >
          Overall
        </button>
        {gradKeys.map((slug) => (
          <button
            key={slug}
            type="button"
            className={`rounded-full px-3 py-1 text-sm ${
              scope === slug
                ? "bg-[var(--accent)] text-[var(--bg)]"
                : "bg-[var(--surface)] text-[var(--muted)]"
            }`}
            onClick={() => setScope(slug)}
          >
            {GRAD_LABELS[slug]}
          </button>
        ))}
      </div>

      <ol className="space-y-2 rounded-2xl bg-[var(--surface)] p-4">
        {rows.length === 0 && (
          <li className="text-center text-[var(--muted)]">No scores yet.</li>
        )}
        {rows.map((row, i) => (
          <li
            key={`${row.name}-${i}`}
            className="flex justify-between border-b border-[var(--muted)]/10 py-2 last:border-0"
          >
            <span>
              {i + 1}. {row.name}
            </span>
            <span className="text-[var(--accent)] tabular-nums">
              {formatLeaderScore(row)}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-center text-xs text-[var(--muted)]">
        Updates every few seconds
      </p>
    </div>
  );
}
