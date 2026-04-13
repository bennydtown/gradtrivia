import { redirect } from "next/navigation";
import { getAdminCookie } from "@/lib/cookies";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { PartyScoreboard } from "./PartyScoreboard";

export default async function PartyPage() {
  if (!verifyAdminCookie(await getAdminCookie())) {
    redirect("/admin/login");
  }
  return <PartyScoreboard />;
}
