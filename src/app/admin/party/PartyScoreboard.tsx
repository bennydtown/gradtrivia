"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatLeaderScore,
  type LeaderboardRow,
} from "@/lib/leaderboard-types";

const ROTATE_MS = 8000;
const GRAD_KEYS = ["overall", "solie", "diego", "levi", "lars", "lucia"] as const;

const TITLES: Record<string, string> = {
  overall: "Overall Leaders · Top 10",
  solie: "Who knows Solie? · Top 10",
  diego: "Who knows Diego? · Top 10",
  levi: "Who knows Levi? · Top 10",
  lars: "Who knows Lars? · Top 10",
  lucia: "Who knows Lucia? · Top 10",
};

export function PartyScoreboard() {
  const [idx, setIdx] = useState(0);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  const scope = GRAD_KEYS[idx];

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/game/leaderboard?grad=${encodeURIComponent(scope)}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as { rows: LeaderboardRow[] };
    setRows(data.rows);
  }, [scope]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % GRAD_KEYS.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)] px-10 py-12 text-[var(--text)]">
      <header className="mb-10 flex items-end justify-between gap-6 border-b border-[var(--muted)]/25 pb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Live
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--accent)] md:text-5xl">
            {TITLES[scope]}
          </h1>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Rotates every {ROTATE_MS / 1000}s
        </p>
      </header>

      <ol className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {rows.length === 0 && (
          <li className="col-span-full text-center text-2xl text-[var(--muted)]">
            No one on the board yet — check back soon.
          </li>
        )}
        {rows.map((row, i) => (
          <li
            key={`${row.name}-${i}`}
            className="flex items-baseline justify-between rounded-2xl bg-[var(--surface)] px-8 py-6 shadow-lg"
          >
            <span className="text-2xl font-medium md:text-3xl">
              <span className="mr-4 text-[var(--muted)]">{i + 1}.</span>
              {row.name}
            </span>
            <span className="text-3xl font-semibold tabular-nums text-[var(--accent)] md:text-4xl">
              {formatLeaderScore(row)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
