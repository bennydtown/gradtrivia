import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { GUESS_SLUG } from "@/lib/constants";
import {
  isValidGuessWhoAnswer,
  wrongAnswersForGuessWho,
} from "@/lib/guess-who-choices";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: raw } = await context.params;
  const id = Number(raw);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: {
    gradSlug?: string;
    questionText?: string;
    correctAnswer?: string;
    wrongAnswers?: string[];
    type?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gradSlug = (body.gradSlug ?? existing.gradSlug).trim().toLowerCase();
  const questionText = (body.questionText ?? existing.questionText).trim();
  const correctAnswer = (body.correctAnswer ?? existing.correctAnswer).trim();

  const type =
    body.type === "guess_who" || gradSlug === GUESS_SLUG
      ? "guess_who"
      : "standard";

  let wrongAnswers: string[];
  if (type === "guess_who") {
    if (!isValidGuessWhoAnswer(correctAnswer)) {
      return NextResponse.json(
        { error: "Guess Who correct answer must be one of the five grads" },
        { status: 400 },
      );
    }
    wrongAnswers = wrongAnswersForGuessWho(correctAnswer);
  } else {
    wrongAnswers = Array.isArray(body.wrongAnswers)
      ? body.wrongAnswers
          .filter((w): w is string => typeof w === "string")
          .map((w) => w.trim())
          .filter(Boolean)
      : (JSON.parse(existing.wrongAnswers) as string[]);
    if (wrongAnswers.length < 1) {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }
  }

  if (!questionText || !correctAnswer) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  await db
    .update(questions)
    .set({
      gradSlug: type === "guess_who" ? GUESS_SLUG : gradSlug,
      questionText,
      correctAnswer,
      wrongAnswers: JSON.stringify(wrongAnswers),
      type,
    })
    .where(eq(questions.id, id));

  const [row] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, id))
    .limit(1);

  return NextResponse.json({ question: row });
}

export async function DELETE(_request: Request, context: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: raw } = await context.params;
  const id = Number(raw);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await db.delete(questions).where(eq(questions.id, id));
  return NextResponse.json({ ok: true });
}
