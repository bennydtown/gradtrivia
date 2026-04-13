import { NextResponse } from "next/server";
import { verifyAdminCookie } from "./admin-auth";
import { getAdminCookie } from "./cookies";

export async function requireAdmin(): Promise<NextResponse | null> {
  const cookie = await getAdminCookie();
  if (!verifyAdminCookie(cookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
