import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { playerAnswers, players } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * Deletes all player sessions and answers. Questions, grads, and images are unchanged.
 */
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [{ n: answerCount }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(playerAnswers);
  const [{ n: playerCount }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(players);

  await db.delete(playerAnswers);
  await db.delete(players);

  return NextResponse.json({
    ok: true,
    deletedAnswers: Number(answerCount),
    deletedPlayers: Number(playerCount),
  });
}
