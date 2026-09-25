import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage(){
  await requireUser();
  return <AppShell><div className="settings-page"><div className="page-head settings-page-head"><div><div className="eyebrow">Werkplek · instellingen</div><h1 className="page-title">Instellingen</h1><p className="page-subtitle">Beheer je account, praktijkgegevens en de identiteit die in professionele rapporten wordt gebruikt.</p></div><div className="settings-page-meta"><span className="status-pill">Beveiligd</span><span className="muted">Wijzigingen worden via je bestaande werkplek opgeslagen.</span></div></div><SettingsForm/></div></AppShell>;
}
