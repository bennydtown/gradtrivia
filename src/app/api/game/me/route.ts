import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playerAnswers, players, questions } from "@/db/schema";
import { getPlayerToken } from "@/lib/cookies";
import { buildShuffledChoices } from "@/lib/questions";

export async function GET() {
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
  const answeredRows = await db
    .select({ id: playerAnswers.id })
    .from(playerAnswers)
    .where(eq(playerAnswers.playerId, player.id));

  const answeredCount = answeredRows.length;

  if (answeredCount >= order.length) {
    return NextResponse.json({
      status: "done" as const,
      displayName: player.displayName,
      totalQuestions: order.length,
    });
  }

  const currentId = order[answeredCount];
  const [q] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, currentId))
    .limit(1);
  if (!q) {
    return NextResponse.json({ error: "Question not found" }, { status: 500 });
  }

  const choices = buildShuffledChoices(q);

  return NextResponse.json({
    status: "playing" as const,
    displayName: player.displayName,
    question: {
      id: q.id,
      text: q.questionText,
      choices,
      index: answeredCount,
      total: order.length,
    },
  });
}
