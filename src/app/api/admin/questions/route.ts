import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { GUESS_SLUG } from "@/lib/constants";
import {
  isValidGuessWhoAnswer,
  wrongAnswersForGuessWho,
} from "@/lib/guess-who-choices";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const rows = await db
    .select()
    .from(questions)
    .orderBy(asc(questions.id));

  return NextResponse.json({ questions: rows });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

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

  const gradSlug = (body.gradSlug ?? "").trim().toLowerCase();
  const questionText = (body.questionText ?? "").trim();
  const correctAnswer = (body.correctAnswer ?? "").trim();
  const type =
    body.type === "guess_who" || gradSlug === GUESS_SLUG
      ? "guess_who"
      : "standard";

  let wrongAnswers = Array.isArray(body.wrongAnswers)
    ? body.wrongAnswers
        .filter((w): w is string => typeof w === "string")
        .map((w) => w.trim())
        .filter(Boolean)
    : [];

  if (type === "guess_who") {
    if (!isValidGuessWhoAnswer(correctAnswer)) {
      return NextResponse.json(
        { error: "Guess Who correct answer must be one of the five grads" },
        { status: 400 },
      );
    }
    wrongAnswers = wrongAnswersForGuessWho(correctAnswer);
  } else if (wrongAnswers.length < 1) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!gradSlug || !questionText || !correctAnswer) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [row] = await db
    .insert(questions)
    .values({
      gradSlug: type === "guess_who" ? GUESS_SLUG : gradSlug,
      questionText,
      correctAnswer,
      wrongAnswers: JSON.stringify(wrongAnswers),
      type,
    })
    .returning();

  return NextResponse.json({ question: row });
}
