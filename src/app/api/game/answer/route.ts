import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  gradImages,
  playerAnswers,
  players,
  questions,
} from "@/db/schema";
import { getPlayerToken } from "@/lib/cookies";
import {
  attributedGradSlug,
  selectedAnswerToImageSlug,
} from "@/lib/grads";
import { answersMatch, buildShuffledChoices } from "@/lib/questions";

export async function POST(request: Request) {
  let body: { questionId?: number; selectedAnswer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const questionId = body.questionId;
  const selectedAnswer =
    typeof body.selectedAnswer === "string" ? body.selectedAnswer : "";

  if (typeof questionId !== "number" || !Number.isInteger(questionId)) {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }

  const token = await getPlayerToken();
  if (!token) {
    return NextResponse.json({ error: "Not joined" }, { status: 401 });
  }

  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.sessionToken, token))
    .limit(1);
  if (!player) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const order = JSON.parse(player.questionOrder) as number[];
  const [{ c: answeredCount }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(playerAnswers)
    .where(eq(playerAnswers.playerId, player.id));

  if (answeredCount >= order.length) {
    return NextResponse.json({ error: "Already finished" }, { status: 400 });
  }

  const expectedId = order[answeredCount];
  if (expectedId !== questionId) {
    return NextResponse.json({ error: "Wrong question order" }, { status: 400 });
  }

  const [q] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);
  if (!q) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = answersMatch(selectedAnswer, q.correctAnswer);
  const attr = attributedGradSlug(q.gradSlug, q.type, q.correctAnswer);

  await db.insert(playerAnswers).values({
    playerId: player.id,
    questionId: q.id,
    selectedAnswer,
    isCorrect,
    attributedGradSlug: attr,
  });

  let imageSlug = q.gradSlug;
  if (q.type === "guess_who") {
    const sel = selectedAnswerToImageSlug(selectedAnswer);
    if (sel) imageSlug = sel;
  }

  const imgs = await db
    .select()
    .from(gradImages)
    .where(eq(gradImages.gradSlug, imageSlug));

  let imageUrl: string | null = null;
  if (imgs.length > 0) {
    const pick = imgs[Math.floor(Math.random() * imgs.length)];
    imageUrl = `/api/grad-image/${pick.gradSlug}/${encodeURIComponent(pick.filename)}`;
  }

  const isLast = answeredCount + 1 >= order.length;
  if (isLast) {
    await db
      .update(players)
      .set({ completedAt: new Date() })
      .where(eq(players.id, player.id));
  }

  if (isLast) {
    return NextResponse.json({
      correct: isCorrect,
      finished: true,
      imageUrl,
      nextQuestion: null,
    });
  }

  const nextId = order[answeredCount + 1];
  const [nextQ] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, nextId))
    .limit(1);
  if (!nextQ) {
    return NextResponse.json({ error: "Next question missing" }, { status: 500 });
  }

  const choices = buildShuffledChoices(nextQ);

  return NextResponse.json({
    correct: isCorrect,
    finished: false,
    imageUrl,
    nextQuestion: {
      id: nextQ.id,
      text: nextQ.questionText,
      choices,
      index: answeredCount + 1,
      total: order.length,
    },
  });
}
