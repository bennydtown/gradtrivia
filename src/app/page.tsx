import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-8 px-6 py-12">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--accent)] sm:text-5xl">
          5 Grad Trivia
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          A party game for family and friends
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/play"
          className="rounded-2xl bg-[var(--accent)] px-6 py-4 text-center text-lg font-semibold text-[var(--bg)] shadow-lg transition hover:bg-[var(--accent-dim)]"
        >
          Play
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-2xl border border-[var(--muted)]/40 px-6 py-4 text-center text-[var(--text)] transition hover:border-[var(--accent)]/60"
        >
          High scores
        </Link>
        <Link
          href="/qr"
          className="text-center text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
        >
          QR poster for hosts
        </Link>
      </div>
      <p className="text-center text-sm text-[var(--muted)]">
        No link to admin — use the URL you were given.
      </p>
    </main>
  );
}
