import Link from "next/link";
import { requireUser } from "@/lib/auth";
import SideNav from "@/components/SideNav";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const initials = (user.name || user.email || "A").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const privateAccount = user.accountType === "PRIVATE";
  return (
    <div className="app-shell app-shell-premium">
      <aside className="sidebar sidebar-premium" aria-label="Alimenta Pro werkplek">
        <div className="brand-lockup brand-lockup-premium"><Link href="/dashboard" className="brand-home" aria-label="Naar Alimenta Pro overzicht"><span className="brand-mark brand-mark-premium" aria-hidden>A</span><span className="brand-copy"><strong>Alimenta</strong><span>PRO</span></span></Link></div>
        <div className="workspace workspace-premium"><div className="workspace-avatar" aria-hidden>{(user.companyName || user.name || "A").slice(0,1).toUpperCase()}</div><div className="workspace-copy"><b>{user.companyName || (privateAccount ? "Persoonlijk dossier" : "Mijn praktijk")}</b><small>{privateAccount ? "Particulier" : user.plan === "FREE" ? "Niet geactiveerd" : "Zakelijk"}</small></div><span className="workspace-dot" aria-label="Werkplek actief" role="img" /></div>
        <SideNav/>
        <div className="sidebar-bottom sidebar-bottom-premium"><div className="help-card help-card-premium"><div className="help-icon" aria-hidden>?</div><div><b>Hulp nodig?</b><span>Instellingen, abonnement of ondersteuning.</span></div><Link href="/settings">Naar instellingen</Link></div><form action="/api/auth/logout" method="post"><button className="logout-btn logout-btn-premium" type="submit"><span aria-hidden>↪</span>Uitloggen</button></form></div>
      </aside>
      <div className="main-area main-area-premium"><header className="topbar topbar-premium"><div className="breadcrumbs" aria-label="Locatie"><span>Alimenta Pro</span><b aria-hidden>/</b><span>Werkplek</span></div><div className="top-actions"><div className="secure-pill"><span className="secure-dot" aria-hidden/>Veilige werkplek</div><div className="user-chip user-chip-premium"><div className="avatar avatar-premium" aria-hidden>{initials}</div><div className="user-chip-copy"><b>{user.name || "Gebruiker"}</b><small>{user.email}</small></div></div></div></header><main className="content content-premium" id="main-content">{children}</main></div>
    </div>
  );
}
