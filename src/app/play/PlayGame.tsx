"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  formatLeaderScore,
  type LeaderboardRow,
} from "@/lib/leaderboard-types";

type QuestionPayload = {
  id: number;
  text: string;
  choices: string[];
  index: number;
  total: number;
};

type MePlaying = {
  status: "playing";
  displayName: string;
  question: QuestionPayload;
};

type MeDone = {
  status: "done";
  displayName: string;
  totalQuestions: number;
};

type Scores = {
  displayName: string;
  totalQuestions: number;
  answered: number;
  correct: number;
  wrong: number;
  completed: boolean;
  byGrad: Record<string, { correct: number; wrong: number }>;
};

const GRAD_LABELS: Record<string, string> = {
  solie: "Solie",
  diego: "Diego",
  levi: "Levi",
  lars: "Lars",
  lucia: "Lucia",
};

export function PlayGame() {
  const [phase, setPhase] = useState<
    "boot" | "intro" | "name" | "play" | "result" | "final"
  >("boot");
  const [nameInput, setNameInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [pendingChoice, setPendingChoice] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [scores, setScores] = useState<Scores | null>(null);
  const [leaderScope, setLeaderScope] = useState<"overall" | string>(
    "overall",
  );
  const [leaderRows, setLeaderRows] = useState<LeaderboardRow[]>([]);
  const [view, setView] = useState<"scores" | "leader">("scores");
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async (scope: string) => {
    const q = scope === "overall" ? "overall" : scope;
    const res = await fetch(`/api/game/leaderboard?grad=${encodeURIComponent(q)}`);
    if (!res.ok) return;
    const data = (await res.json()) as { rows: LeaderboardRow[] };
    setLeaderRows(data.rows);
  }, []);

  const loadScores = useCallback(async () => {
    const res = await fetch("/api/game/scores");
    if (!res.ok) return;
    const data = (await res.json()) as Scores;
    setScores(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/game/me");
        if (cancelled) return;
        if (res.status === 401) {
          setPhase("intro");
          return;
        }
        const data = (await res.json()) as MePlaying | MeDone;
        if (data.status === "done") {
          setDisplayName(data.displayName);
          const sr = await fetch("/api/game/scores");
          if (sr.ok) {
            setScores((await sr.json()) as Scores);
          }
          setPhase("final");
          return;
        }
        setDisplayName(data.displayName);
        setQuestion(data.question);
        setPhase("play");
      } catch {
        setPhase("intro");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadScores]);

  useEffect(() => {
    if (phase !== "final") return;
    void loadLeaderboard(leaderScope);
    const t = setInterval(() => {
      void loadLeaderboard(leaderScope);
    }, 8000);
    return () => clearInterval(t);
  }, [phase, leaderScope, loadLeaderboard]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = nameInput.trim();
    if (name.length < 1) {
      setError("Enter a name");
      return;
    }
    const res = await fetch("/api/game/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setError(err.error ?? "Could not join");
      return;
    }
    const data = (await res.json()) as {
      displayName: string;
      question: QuestionPayload;
    };
    setDisplayName(data.displayName);
    setQuestion(data.question);
    setPhase("play");
  }

  async function submitAnswer(choice: string) {
    if (!question || pendingChoice) return;
    setPendingChoice(choice);
    setError(null);
    const res = await fetch("/api/game/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: question.id,
        selectedAnswer: choice,
      }),
    });
    if (!res.ok) {
      setPendingChoice(null);
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setError(err.error ?? "Error");
      return;
    }
    const data = (await res.json()) as {
      correct: boolean;
      finished: boolean;
      imageUrl: string | null;
      nextQuestion: QuestionPayload | null;
    };
    setLastCorrect(data.correct);
    setResultImage(data.imageUrl);
    if (data.finished) {
      setGameComplete(true);
      setQuestion(null);
      setPendingChoice(null);
      setPhase("result");
      return;
    }
    setGameComplete(false);
    setQuestion(data.nextQuestion);
    setPendingChoice(null);
    setPhase("result");
  }

  async function continueAfterResult() {
    if (gameComplete) {
      await loadScores();
      setPhase("final");
      setLastCorrect(null);
      setResultImage(null);
      setGameComplete(false);
      return;
    }
    setPhase("play");
    setLastCorrect(null);
    setResultImage(null);
  }

  async function leaveAndRestart() {
    await fetch("/api/game/leave", { method: "POST" });
    setScores(null);
    setQuestion(null);
    setNameInput("");
    setDisplayName("");
    setPhase("intro");
  }

  if (phase === "boot") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-5 py-10">
        <header>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--accent)]">
            5 Grad Trivia
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            See how much you know about the 5 graduating cousins!
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[length:calc(0.875rem*1.25)] text-[var(--text)]/90">
            <li>Graduates won&apos;t tell you the answers, but they can tell you who MIGHT know.</li>
            <li>Play at your own pace. Have fun!</li>
          </ul>
        </header>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <label className="block">
            <span className="text-sm text-[var(--muted)]">Your name</span>
            <input
              className="mt-1 w-full rounded-xl border border-[var(--muted)]/30 bg-[var(--surface)] px-4 py-3 text-lg text-[var(--text)] outline-none ring-[var(--accent)]/40 focus:ring-2"
              placeholder="Party name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={48}
              autoComplete="nickname"
            />
          </label>
          {error && (
            <p className="text-sm text-[var(--error)]" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="rounded-2xl bg-[var(--accent)] py-4 text-lg font-semibold text-[var(--bg)]"
          >
            Start
          </button>
        </form>
      </div>
    );
  }

  if (phase === "result" && lastCorrect !== null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-5 py-8">
        <div
          className={`rounded-2xl px-4 py-3 text-center text-xl font-semibold ${
            lastCorrect
              ? "bg-[var(--success)]/20 text-[var(--success)]"
              : "bg-[var(--error)]/20 text-[var(--error)]"
          }`}
        >
          {lastCorrect ? "Correct!" : "Not quite"}
        </div>
        {resultImage && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/30">
            <Image
              src={resultImage}
              alt=""
              fill
              className="object-cover"
              unoptimized
              sizes="100vw"
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => void continueAfterResult()}
          className="rounded-2xl bg-[var(--accent)] py-4 text-lg font-semibold text-[var(--bg)]"
        >
          {gameComplete ? "See scores" : "Next question"}
        </button>
      </div>
    );
  }

  if (phase === "final" && !scores) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-[var(--muted)]">
        Loading scores…
      </div>
    );
  }

  if (phase === "final" && scores) {
    const gradKeys = Object.keys(GRAD_LABELS);
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-5 py-8">
        <header className="text-center">
          <p className="text-[var(--muted)]">Nice work,</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--accent)]">
            {scores.displayName}
          </h1>
        </header>

        <div className="flex gap-2 rounded-xl bg-[var(--surface)] p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              view === "scores"
                ? "bg-[var(--accent)] text-[var(--bg)]"
                : "text-[var(--muted)]"
            }`}
            onClick={() => setView("scores")}
          >
            Your scores
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              view === "leader"
                ? "bg-[var(--accent)] text-[var(--bg)]"
                : "text-[var(--muted)]"
            }`}
            onClick={() => setView("leader")}
          >
            High scores
          </button>
        </div>

        {view === "scores" && (
          <div className="space-y-4 rounded-2xl bg-[var(--surface)] p-5">
            <div className="flex justify-between text-lg">
              <span className="text-[var(--muted)]">Overall</span>
              <span>
                <strong className="text-[var(--accent)]">{scores.correct}</strong>
                <span className="text-[var(--muted)]"> / {scores.totalQuestions}</span>
              </span>
            </div>
            <div className="border-t border-[var(--muted)]/20 pt-4">
              <p className="mb-3 text-sm font-medium text-[var(--muted)]">
                By graduate
              </p>
              <ul className="space-y-2">
                {gradKeys.map((slug) => (
                  <li
                    key={slug}
                    className="flex justify-between text-sm"
                  >
                    <span>{GRAD_LABELS[slug]}</span>
                    <span>
                      {scores.byGrad[slug]?.correct ?? 0} correct
                      {(scores.byGrad[slug]?.wrong ?? 0) > 0 && (
                        <span className="text-[var(--muted)]">
                          {" "}
                          ({scores.byGrad[slug]?.wrong} missed)
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {view === "leader" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-sm ${
                  leaderScope === "overall"
                    ? "bg-[var(--accent)] text-[var(--bg)]"
                    : "bg-[var(--surface)] text-[var(--muted)]"
                }`}
                onClick={() => {
                  setLeaderScope("overall");
                  void loadLeaderboard("overall");
                }}
              >
                Overall
              </button>
              {gradKeys.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  className={`rounded-full px-3 py-1 text-sm ${
                    leaderScope === slug
                      ? "bg-[var(--accent)] text-[var(--bg)]"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                  onClick={() => {
                    setLeaderScope(slug);
                    void loadLeaderboard(slug);
                  }}
                >
                  {GRAD_LABELS[slug]}
                </button>
              ))}
            </div>
            <ol className="space-y-2 rounded-2xl bg-[var(--surface)] p-4">
              {leaderRows.length === 0 && (
                <li className="text-center text-[var(--muted)]">
                  No scores yet — be the first!
                </li>
              )}
              {leaderRows.map((row, i) => (
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
          </div>
        )}

        <button
          type="button"
          onClick={leaveAndRestart}
          className="rounded-2xl border border-[var(--muted)]/40 py-3 text-[var(--muted)]"
        >
          New player on this device
        </button>
      </div>
    );
  }

  if (phase === "play" && question) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-5 py-8">
        <div className="flex items-center justify-between text-sm text-[var(--muted)]">
          <span>
            {displayName}
          </span>
          <span>
            {question.index + 1} / {question.total}
          </span>
        </div>
        <p className="text-lg leading-snug">{question.text}</p>
        <div className="flex flex-col gap-3">
          {question.choices.map((c, i) => (
            <button
              key={`${question.id}-${i}`}
              type="button"
              disabled={!!pendingChoice}
              onClick={() => void submitAnswer(c)}
              className="rounded-2xl border border-[var(--muted)]/35 bg-[var(--surface)] px-4 py-4 text-left text-[var(--text)] transition hover:border-[var(--accent)]/50 disabled:opacity-60"
            >
              {c}
            </button>
          ))}
        </div>
        {error && (
          <p className="text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return null;
}
