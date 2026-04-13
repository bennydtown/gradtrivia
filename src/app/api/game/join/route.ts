import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { players, questions } from "@/db/schema";
import { generateSessionToken } from "@/lib/admin-auth";
import { setPlayerToken } from "@/lib/cookies";
import { buildShuffledChoices } from "@/lib/questions";
import { shuffledCopy } from "@/lib/shuffle";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const displayName =
    typeof body === "object" &&
    body !== null &&
    "displayName" in body &&
    typeof (body as { displayName: unknown }).displayName === "string"
      ? (body as { displayName: string }).displayName
      : "";

  const name = displayName.trim();
  if (name.length < 1 || name.length > 48) {
    return NextResponse.json(
      { error: "Name must be 1–48 characters" },
      { status: 400 },
    );
  }

  const allQ = await db.select({ id: questions.id }).from(questions);
  if (allQ.length === 0) {
    return NextResponse.json(
      { error: "No questions configured yet" },
      { status: 503 },
    );
  }

  const order = shuffledCopy(allQ.map((q) => q.id));
  const token = generateSessionToken();

  await db.insert(players).values({
    displayName: name,
    sessionToken: token,
    questionOrder: JSON.stringify(order),
  });

  await setPlayerToken(token);

  const firstId = order[0];
  const [q] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, firstId))
    .limit(1);
  if (!q) {
    return NextResponse.json({ error: "Question not found" }, { status: 500 });
  }

  const choices = buildShuffledChoices(q);

  return NextResponse.json({
    displayName: name,
    totalQuestions: order.length,
    question: {
      id: q.id,
      text: q.questionText,
      choices,
      index: 0,
      total: order.length,
    },
  });
}
