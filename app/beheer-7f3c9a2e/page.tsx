import { requireAdmin } from "@/lib/auth";
import AdminPortal from "./AdminPortal";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  void styles;
  return <AdminPortal adminEmail={admin.email} />;
}
