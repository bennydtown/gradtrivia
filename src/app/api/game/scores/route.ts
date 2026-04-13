import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playerAnswers, players, questions } from "@/db/schema";
import { getPlayerToken } from "@/lib/cookies";
import { GRAD_SLUGS } from "@/lib/constants";

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

  const answers = await db
    .select({
      isCorrect: playerAnswers.isCorrect,
      attr: playerAnswers.attributedGradSlug,
    })
    .from(playerAnswers)
    .where(eq(playerAnswers.playerId, player.id));

  const total = answers.length;
  const correct = answers.filter((a) => a.isCorrect).length;
  const wrong = total - correct;

  const byGrad: Record<string, { correct: number; wrong: number }> = {};
  for (const slug of GRAD_SLUGS) {
    byGrad[slug] = { correct: 0, wrong: 0 };
  }

  for (const row of answers) {
    const g = row.attr;
    if (g in byGrad) {
      if (row.isCorrect) byGrad[g].correct += 1;
      else byGrad[g].wrong += 1;
    }
  }

  const order = JSON.parse(player.questionOrder) as number[];
  const [{ n: qTotal }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(questions);

  return NextResponse.json({
    displayName: player.displayName,
    totalQuestions: order.length,
    answered: total,
    correct,
    wrong,
    completed: player.completedAt != null,
    byGrad,
    catalogQuestionCount: qTotal,
  });
}
