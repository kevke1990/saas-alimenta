import { requireUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import EditClientForm from "./EditClientForm";

export default async function EditClient() {
  await requireUser();
  return <AppShell><EditClientForm /></AppShell>;
}
