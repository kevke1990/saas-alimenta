import { requireUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import NewClientForm from "./NewClientForm";

export default async function NewClient() {
  await requireUser();
  return <AppShell><NewClientForm /></AppShell>;
}
