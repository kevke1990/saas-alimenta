import { redirect } from "next/navigation";
import { currentUser, normalizeEmail } from "@/lib/auth";
import AdminPortal from "./AdminPortal";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  const configuredAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "");
  const isAdmin = Boolean(
    user &&
      (user.isAdmin || user.role === "ADMIN") &&
      configuredAdminEmail &&
      normalizeEmail(user.email) === configuredAdminEmail,
  );

  if (!user) redirect("/login?next=/beheer-7f3c9a2e");
  if (!isAdmin) redirect("/dashboard?error=forbidden");

  void styles;
  return <AdminPortal adminEmail={user.email} />;
}
