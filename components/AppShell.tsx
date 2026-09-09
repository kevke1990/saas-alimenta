import Link from "next/link";
import { requireUser } from "@/lib/auth";
import SideNav from "@/components/SideNav";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const initials = (user.name || user.email || "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell app-shell-premium">
      <aside className="sidebar sidebar-premium">
        <div className="brand-lockup brand-lockup-premium">
          <Link href="/dashboard" className="brand-home" aria-label="Alimenta Pro dashboard">
            <div className="brand-mark brand-mark-premium">A</div>
            <div><strong>Alimenta</strong><span>PRO</span></div>
          </Link>
        </div>

        <div className="workspace workspace-premium">
          <div className="workspace-avatar">{(user.companyName || user.name || "A").slice(0, 1).toUpperCase()}</div>
          <div className="workspace-copy"><b>{user.companyName || "Mijn praktijk"}</b><small>{user.plan === "FREE" ? "Gratis" : user.plan}</small></div>
          <span className="workspace-dot" aria-hidden />
        </div>

        <SideNav />

        <div className="sidebar-bottom sidebar-bottom-premium">
          <div className="help-card help-card-premium">
            <div className="help-icon">?</div>
            <div><b>Hulp nodig?</b><span>Bekijk instellingen, abonnement of ondersteuning.</span></div>
            <Link href="/billing">Beheer account →</Link>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="logout-btn logout-btn-premium" type="submit">Uitloggen</button>
          </form>
        </div>
      </aside>

      <div className="main-area main-area-premium">
        <header className="topbar topbar-premium">
          <div className="breadcrumbs">
            <span>Alimenta Pro</span><b>/</b><span>Werkplek</span>
          </div>
          <div className="top-actions">
            <div className="secure-pill"><span className="secure-dot" /> Veilige werkplek</div>
            <div className="user-chip user-chip-premium">
              <div className="avatar avatar-premium">{initials}</div>
              <div><b>{user.name || "Gebruiker"}</b><small>{user.email}</small></div>
            </div>
          </div>
        </header>
        <main className="content content-premium">{children}</main>
      </div>
    </div>
  );
}
