"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GRAD_SLUGS, GUESS_SLUG } from "@/lib/constants";
import {
  GUESS_WHO_DISPLAY_NAMES,
  wrongAnswersForGuessWho,
} from "@/lib/guess-who-choices";

type QuestionRow = {
  id: number;
  gradSlug: string;
  questionText: string;
  correctAnswer: string;
  wrongAnswers: string;
  type: string;
};

const GRAD_LABELS: Record<string, string> = {
  [GUESS_SLUG]: "Guess Who",
  solie: "Solie",
  diego: "Diego",
  levi: "Levi",
  lars: "Lars",
  lucia: "Lucia",
};

export function AdminDashboard() {
  const [tab, setTab] = useState<"questions" | "images">("questions");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newGrad, setNewGrad] = useState("levi");
  const [newText, setNewText] = useState("");
  const [newCorrect, setNewCorrect] = useState("");
  const [newWrongs, setNewWrongs] = useState(["", "", "", ""]);

  const [editingGuessId, setEditingGuessId] = useState<number | null>(null);
  const [editGuessText, setEditGuessText] = useState("");
  const [editGuessCorrect, setEditGuessCorrect] = useState("");

  const [imageGrad, setImageGrad] = useState<(typeof GRAD_SLUGS)[number]>("levi");
  const [images, setImages] = useState<
    { id: number; gradSlug: string; filename: string }[]
  >([]);

  const loadQuestions = useCallback(async () => {
    const res = await fetch("/api/admin/questions");
    if (!res.ok) {
      setError("Could not load questions");
      return;
    }
    const data = (await res.json()) as { questions: QuestionRow[] };
    setQuestions(data.questions);
    setError(null);
  }, []);

  const loadImages = useCallback(async () => {
    const res = await fetch(
      `/api/admin/grad-images?grad=${encodeURIComponent(imageGrad)}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      images: { id: number; gradSlug: string; filename: string }[];
    };
    setImages(data.images);
  }, [imageGrad]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadQuestions();
      setLoading(false);
    })();
  }, [loadQuestions]);

  useEffect(() => {
    if (tab !== "images") return;
    void loadImages();
  }, [tab, loadImages]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    const isGuess = newGrad === GUESS_SLUG;
    const wrongs = isGuess
      ? wrongAnswersForGuessWho(newCorrect)
      : newWrongs.map((w) => w.trim()).filter(Boolean);
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gradSlug: newGrad,
        questionText: newText.trim(),
        correctAnswer: newCorrect.trim(),
        wrongAnswers: wrongs,
      }),
    });
    if (!res.ok) {
      setError("Could not add question");
      return;
    }
    setNewText("");
    setNewCorrect("");
    setNewWrongs(["", "", "", ""]);
    await loadQuestions();
  }

  function startEditGuessWho(q: QuestionRow) {
    setEditingGuessId(q.id);
    setEditGuessText(q.questionText);
    setEditGuessCorrect(q.correctAnswer);
  }

  function cancelEditGuessWho() {
    setEditingGuessId(null);
    setEditGuessText("");
    setEditGuessCorrect("");
  }

  async function saveGuessWhoEdit(e: React.FormEvent, id: number) {
    e.preventDefault();
    const res = await fetch(`/api/admin/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gradSlug: GUESS_SLUG,
        type: "guess_who",
        questionText: editGuessText.trim(),
        correctAnswer: editGuessCorrect.trim(),
      }),
    });
    if (!res.ok) {
      setError("Could not save question");
      return;
    }
    setError(null);
    cancelEditGuessWho();
    await loadQuestions();
  }

  async function deleteQuestion(id: number) {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    await loadQuestions();
  }

  async function importCsv(file: File | null) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/import-csv", { method: "POST", body: fd });
    if (!res.ok) {
      setError("Import failed");
      return;
    }
    await loadQuestions();
  }

  async function uploadImage(file: File | null) {
    if (!file) return;
    const fd = new FormData();
    fd.append("grad", imageGrad);
    fd.append("file", file);
    const res = await fetch("/api/admin/grad-images", { method: "POST", body: fd });
    if (!res.ok) {
      setError("Upload failed");
      return;
    }
    await loadImages();
  }

  async function deleteImage(id: number) {
    if (!confirm("Delete this image?")) return;
    await fetch("/api/admin/grad-images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadImages();
  }

  async function resetGameData() {
    if (
      !confirm(
        "This will permanently delete all player sessions and every score on the leaderboards. Questions and images are not affected.\n\nAre you sure?",
      )
    ) {
      return;
    }
    if (
      !confirm(
        "This cannot be undone. Everyone will need to join again from scratch. Continue?",
      )
    ) {
      return;
    }
    const res = await fetch("/api/admin/reset-game", { method: "POST" });
    if (!res.ok) {
      setError("Could not reset game data");
      return;
    }
    const data = (await res.json()) as {
      deletedPlayers: number;
      deletedAnswers: number;
    };
    setError(null);
    alert(
      `Reset complete. Removed ${data.deletedPlayers} player(s) and ${data.deletedAnswers} answer record(s).`,
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--accent)]">
          Admin
        </h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/admin/party"
            className="rounded-lg border border-[var(--muted)]/40 px-3 py-2 text-[var(--muted)] hover:border-[var(--accent)]"
          >
            Party scoreboard
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-[var(--muted)]/40 px-3 py-2 text-[var(--muted)]"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          className={`rounded-lg px-4 py-2 ${
            tab === "questions"
              ? "bg-[var(--accent)] text-[var(--bg)]"
              : "bg-[var(--surface)] text-[var(--muted)]"
          }`}
          onClick={() => setTab("questions")}
        >
          Questions
        </button>
        <button
          type="button"
          className={`rounded-lg px-4 py-2 ${
            tab === "images"
              ? "bg-[var(--accent)] text-[var(--bg)]"
              : "bg-[var(--surface)] text-[var(--muted)]"
          }`}
          onClick={() => setTab("images")}
        >
          Images
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-[var(--error)]" role="alert">
          {error}
        </p>
      )}

      {tab === "questions" && (
        <div className="space-y-8">
          <section className="rounded-2xl bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-lg font-medium">Add question</h2>
            <form onSubmit={addQuestion} className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2 block text-sm">
                <span className="text-[var(--muted)]">Grad</span>
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--bg)] px-3 py-2"
                  value={newGrad}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewGrad(v);
                    if (v === GUESS_SLUG) {
                      setNewCorrect("");
                      setNewWrongs(["", "", "", ""]);
                    }
                  }}
                >
                  {GRAD_SLUGS.map((g) => (
                    <option key={g} value={g}>
                      {GRAD_LABELS[g]}
                    </option>
                  ))}
                  <option value={GUESS_SLUG}>{GRAD_LABELS[GUESS_SLUG]}</option>
                </select>
              </label>
              <label className="sm:col-span-2 block text-sm">
                <span className="text-[var(--muted)]">Question</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--bg)] px-3 py-2"
                  rows={3}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  required
                />
              </label>
              {newGrad === GUESS_SLUG ? (
                <>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-[var(--muted)]">Correct answer</span>
                    <select
                      className="mt-1 w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--bg)] px-3 py-2"
                      value={newCorrect}
                      onChange={(e) => setNewCorrect(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select grad…
                      </option>
                      {GUESS_WHO_DISPLAY_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-sm text-[var(--muted)] sm:col-span-2">
                    The other four grads are used automatically as wrong choices.
                  </p>
                </>
              ) : (
                <>
                  <label className="block text-sm">
                    <span className="text-[var(--muted)]">Correct answer</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--bg)] px-3 py-2"
                      value={newCorrect}
                      onChange={(e) => setNewCorrect(e.target.value)}
                      required
                    />
                  </label>
                  {newWrongs.map((w, i) => (
                    <label key={i} className="block text-sm">
                      <span className="text-[var(--muted)]">Wrong {i + 1}</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--bg)] px-3 py-2"
                        value={w}
                        onChange={(e) => {
                          const next = [...newWrongs];
                          next[i] = e.target.value;
                          setNewWrongs(next);
                        }}
                      />
                    </label>
                  ))}
                </>
              )}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--accent)] px-5 py-2 font-semibold text-[var(--bg)]"
                >
                  Add question
                </button>
              </div>
            </form>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-4">
              <h2 className="text-lg font-medium">Import CSV</h2>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => void importCsv(e.target.files?.[0] ?? null)}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">
              All questions ({loading ? "…" : questions.length})
            </h2>
            <ul className="space-y-3">
              {questions.map((q) => (
                <li
                  key={q.id}
                  className="rounded-xl border border-[var(--muted)]/20 p-4"
                >
                  {editingGuessId === q.id && q.type === "guess_who" ? (
                    <form
                      className="space-y-3"
                      onSubmit={(e) => void saveGuessWhoEdit(e, q.id)}
                    >
                      <span className="text-xs uppercase text-[var(--accent)]">
                        {GRAD_LABELS[GUESS_SLUG]} · guess_who
                      </span>
                      <label className="block text-sm">
                        <span className="text-[var(--muted)]">Question</span>
                        <textarea
                          className="mt-1 w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--bg)] px-3 py-2"
                          rows={3}
                          value={editGuessText}
                          onChange={(e) => setEditGuessText(e.target.value)}
                          required
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="text-[var(--muted)]">
                          Correct answer
                        </span>
                        <select
                          className="mt-1 w-full rounded-lg border border-[var(--muted)]/30 bg-[var(--bg)] px-3 py-2"
                          value={editGuessCorrect}
                          onChange={(e) => setEditGuessCorrect(e.target.value)}
                          required
                        >
                          {!GUESS_WHO_DISPLAY_NAMES.includes(editGuessCorrect) &&
                            editGuessCorrect.trim() !== "" && (
                              <option value={editGuessCorrect}>
                                {editGuessCorrect} (fix)
                              </option>
                            )}
                          {GUESS_WHO_DISPLAY_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-xs text-[var(--muted)]">
                        Wrong choices are the other four grads (set on save).
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--bg)]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditGuessWho}
                          className="rounded-lg border border-[var(--muted)]/40 px-4 py-2 text-sm text-[var(--muted)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-xs uppercase text-[var(--accent)]">
                          {GRAD_LABELS[q.gradSlug] ?? q.gradSlug} · {q.type}
                        </span>
                        <p className="mt-1">{q.questionText}</p>
                        {q.type === "guess_who" && (
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            Answer: {q.correctAnswer}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {q.type === "guess_who" && (
                          <button
                            type="button"
                            onClick={() => startEditGuessWho(q)}
                            className="text-sm text-[var(--accent)]"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void deleteQuestion(q.id)}
                          className="text-sm text-[var(--error)]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === "images" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm">
              <span className="text-[var(--muted)]">Grad</span>
              <select
                className="ml-2 rounded-lg border border-[var(--muted)]/30 bg-[var(--surface)] px-3 py-2"
                value={imageGrad}
                onChange={(e) =>
                  setImageGrad(e.target.value as (typeof GRAD_SLUGS)[number])
                }
              >
                {GRAD_SLUGS.map((g) => (
                  <option key={g} value={g}>
                    {GRAD_LABELS[g]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Upload
              <input
                type="file"
                accept="image/*"
                className="ml-2"
                onChange={(e) =>
                  void uploadImage(e.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((im) => (
              <div
                key={im.id}
                className="overflow-hidden rounded-xl border border-[var(--muted)]/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/grad-image/${im.gradSlug}/${encodeURIComponent(im.filename)}`}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  className="w-full py-2 text-center text-xs text-[var(--error)]"
                  onClick={() => void deleteImage(im.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="mt-12 border-t border-[var(--error)]/35 pt-8">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--error)]">
          Reset game data
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
          Clears all players, answers, and leaderboard scores. Use before the
          party for a clean slate, or to wipe test runs. Questions and photos are
          not deleted.
        </p>
        <button
          type="button"
          onClick={() => void resetGameData()}
          className="mt-4 rounded-xl border border-[var(--error)]/50 bg-[var(--error)]/10 px-5 py-3 text-sm font-semibold text-[var(--error)] transition hover:bg-[var(--error)]/20"
        >
          Reset all scores and sessions
        </button>
      </section>
    </div>
  );
}
