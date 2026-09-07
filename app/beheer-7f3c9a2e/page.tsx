import { requireAdmin } from "@/lib/auth";
import AdminPortal from "./AdminPortal";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  return <AdminPortal adminEmail={admin.email} />;
}
