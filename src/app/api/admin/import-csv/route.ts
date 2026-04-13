import { parse } from "csv-parse/sync";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { GUESS_SLUG } from "@/lib/constants";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const text = await file.text();
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  let inserted = 0;
  for (const row of records) {
    const gradCol = row["Grad"] ?? row["grad"];
    const qtext = row["Question"];
    const answer = row["Answer"];
    const w1 = row["Wrong Answer 1"];
    const w2 = row["Wrong Answer 2"];
    const w3 = row["Wrong Answer 3"];
    const w4 = row["Wrong Answer 4"];
    const wrongs = [w1, w2, w3, w4].filter((w) => w && w.trim().length > 0);

    const g = (gradCol ?? "").trim();
    const gradSlug =
      g.toLowerCase() === "guess" ? GUESS_SLUG : g.toLowerCase();
    const type = gradSlug === GUESS_SLUG ? "guess_who" : "standard";

    await db.insert(questions).values({
      gradSlug,
      questionText: qtext,
      correctAnswer: answer,
      wrongAnswers: JSON.stringify(wrongs),
      type,
    });
    inserted += 1;
  }

  return NextResponse.json({ inserted });
}
