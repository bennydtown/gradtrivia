import { NextResponse } from "next/server";
import { clearPlayerToken } from "@/lib/cookies";

export async function POST() {
  await clearPlayerToken();
  return NextResponse.json({ ok: true });
}
