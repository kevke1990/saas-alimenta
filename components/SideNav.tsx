"use client";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const nav: Array<{ href: Route; label: string; icon: string }> = [
  { href: "/dashboard", label: "Overzicht", icon: "grid" },
  { href: "/work", label: "Werkvoorraad", icon: "briefcase" },
  { href: "/clients", label: "Cliënten", icon: "users" },
  { href: "/cases", label: "Dossiers", icon: "folder" },
  { href: "/cases/new", label: "Nieuwe berekening", icon: "plus" },
  { href: "/scan", label: "Documenten scannen", icon: "scan" },
  { href: "/mail", label: "E-mail", icon: "mail" },
  { href: "/billing", label: "Abonnement", icon: "card" },
  { href: "/settings", label: "Instellingen", icon: "settings" },
];

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "briefcase") return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></svg>;
  if (name === "users") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (name === "plus") return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>;
  if (name === "scan") return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 17h8M12 10v4"/></svg>;
  if (name === "mail") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
  if (name === "card") return <svg {...common}><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9h19M7 15h3"/></svg>;
  if (name === "folder") return <svg {...common}><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4l2 2h7A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>;
  if (name === "settings") return <svg {...common}><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.2A1.7 1.7 0 0 0 7.76 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06A1.7 1.7 0 0 0 11 6.76 1.7 1.7 0 0 0 12.03 5.2V5h2.4v.2A1.7 1.7 0 0 0 15.46 6.76a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 18.7 10c.2.62.79 1.03 1.44 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z"/></svg>;
  return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}

export default function SideNav() {
  const path = usePathname();
  return <nav className="side-nav side-nav-premium" aria-label="Werkpleknavigatie"><div className="nav-label">WERKPLEK</div>{nav.map((item)=>{const active=item.href==="/dashboard"?path==="/dashboard":path===item.href||path.startsWith(item.href+"/");return <Link key={item.href} href={item.href} className={`side-link side-link-premium${active?" active":""}`} aria-current={active?"page":undefined}><Icon name={item.icon}/><span>{item.label}</span>{item.href==="/cases/new"?<span className="nav-cta-dot"/>:null}</Link>})}</nav>;
}
