import Image from "next/image";

export default function QrPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center gap-8 px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--accent)]">
        Scan to play
      </h1>
      <p className="text-center text-[var(--muted)]">
        Opens the game at <code className="text-[var(--text)]">/play</code>. Use
        browser print to put this on a poster.
      </p>
      <div className="rounded-2xl bg-white p-4 shadow-xl">
        <Image
          src="/api/qr"
          alt="QR code to join the trivia game"
          width={480}
          height={480}
          unoptimized
          className="h-auto w-full max-w-[min(90vw,480px)]"
          priority
        />
      </div>
    </div>
  );
}
