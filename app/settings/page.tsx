import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage(){
  await requireUser();
  return <AppShell><div className="page-head"><div><div className="eyebrow">Werkplek · instellingen</div><h1 className="page-title">Instellingen</h1><p className="page-subtitle">Eén plek voor account-, praktijk-, huisstijl- en rapportgegevens.</p></div></div><SettingsForm/></AppShell>;
}
