import Link from "next/link";
import { requireUser } from "@/lib/auth";
import SideNav from "@/components/SideNav";

export default async function AppShell({children}:{children:React.ReactNode}) {
  const user = await requireUser();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup"><div className="brand-mark">A</div><div><strong>Alimenta</strong><span>PRO</span></div></div>
      <div className="workspace"><div className="workspace-avatar">{(user.companyName || user.name || "A").slice(0,1).toUpperCase()}</div><div className="workspace-copy"><b>{user.companyName || "Mijn praktijk"}</b><small>{user.plan === "FREE" ? "Gratis" : user.plan}</small></div><span className="chevron">⌄</span></div>
      <SideNav/>
      <div className="sidebar-bottom"><div className="help-card"><b>Hulp nodig?</b><span>Bekijk je abonnement of instellingen.</span><Link href="/billing">Naar instellingen →</Link></div><form action="/api/auth/logout" method="post"><button className="logout-btn">Uitloggen</button></form></div>
    </aside>
    <div className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Alimenta Pro</span><b>/</b><span>Werkplek</span></div><div className="top-actions"><div className="user-chip"><div className="avatar">{(user.name || user.email).slice(0,1).toUpperCase()}</div><div><b>{user.name || "Gebruiker"}</b><small>{user.email}</small></div></div></div></header>
      <main className="content">{children}</main>
    </div>
  </div>;
}
