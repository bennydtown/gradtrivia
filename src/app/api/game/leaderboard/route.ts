import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playerAnswers, players } from "@/db/schema";
import { GRAD_SLUGS } from "@/lib/constants";

/** Sort: most correct first, then best accuracy in scope, then more attempts in scope. */
function orderByLeaderboard() {
  const correctSum = sql`sum(case when ${playerAnswers.isCorrect} then 1 else 0 end)`;
  const accuracy = sql`(cast(${correctSum} as real) / count(*))`;
  return [desc(correctSum), desc(accuracy), desc(sql`count(*)`)] as const;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grad = searchParams.get("grad") ?? "overall";

  if (grad !== "overall" && !GRAD_SLUGS.includes(grad as (typeof GRAD_SLUGS)[number])) {
    return NextResponse.json({ error: "Invalid grad" }, { status: 400 });
  }

  if (grad === "overall") {
    const rows = await db
      .select({
        displayName: players.displayName,
        correct: sql<number>`sum(case when ${playerAnswers.isCorrect} then 1 else 0 end)`.mapWith(
          Number,
        ),
        answered: sql<number>`count(*)`.mapWith(Number),
      })
      .from(players)
      .innerJoin(playerAnswers, eq(playerAnswers.playerId, players.id))
      .groupBy(players.id, players.displayName)
      .orderBy(...orderByLeaderboard())
      .limit(10);

    return NextResponse.json({
      scope: "overall" as const,
      rows: rows.map((r) => ({
        name: r.displayName,
        correct: r.correct,
        answered: r.answered,
      })),
    });
  }

  const rows = await db
    .select({
      displayName: players.displayName,
      correct: sql<number>`sum(case when ${playerAnswers.isCorrect} then 1 else 0 end)`.mapWith(
        Number,
      ),
      answered: sql<number>`count(*)`.mapWith(Number),
    })
    .from(players)
    .innerJoin(playerAnswers, eq(playerAnswers.playerId, players.id))
    .where(eq(playerAnswers.attributedGradSlug, grad))
    .groupBy(players.id, players.displayName)
    .orderBy(...orderByLeaderboard())
    .limit(10);

  return NextResponse.json({
    scope: grad,
    rows: rows.map((r) => ({
      name: r.displayName,
      correct: r.correct,
      answered: r.answered,
    })),
  });
}
