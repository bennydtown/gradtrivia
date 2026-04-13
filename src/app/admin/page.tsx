import { redirect } from "next/navigation";
import { getAdminCookie } from "@/lib/cookies";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { AdminDashboard } from "./AdminDashboard";

export default async function AdminPage() {
  if (!verifyAdminCookie(await getAdminCookie())) {
    redirect("/admin/login");
  }
  return <AdminDashboard />;
}
