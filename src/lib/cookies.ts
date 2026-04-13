import { cookies } from "next/headers";

export const PLAYER_COOKIE = "player_token";
export const ADMIN_COOKIE = "grad_admin";

export async function getPlayerToken(): Promise<string | null> {
  return (await cookies()).get(PLAYER_COOKIE)?.value ?? null;
}

export async function setPlayerToken(token: string): Promise<void> {
  (await cookies()).set(PLAYER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
  });
}

export async function clearPlayerToken(): Promise<void> {
  (await cookies()).delete(PLAYER_COOKIE);
}

export async function getAdminCookie(): Promise<string | null> {
  return (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
}
