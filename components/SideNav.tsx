"use client";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const nav: Array<{href: Route; label: string; icon: string}> = [
 {href:"/dashboard",label:"Overzicht",icon:"grid"},
 {href:"/clients",label:"Cliënten",icon:"users"},
 {href:"/cases",label:"Dossiers",icon:"folder"},
 {href:"/cases/new",label:"Nieuwe berekening",icon:"plus"},
 {href:"/scan",label:"Scan document",icon:"scan"},
 {href:"/mail",label:"E-mail",icon:"mail"},
 {href:"/billing",label:"Abonnement",icon:"card"},
];
function Icon({name}:{name:string}){const common={width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};if(name==="users")return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;if(name==="plus")return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>;if(name==="scan")return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 17h8M12 10v4"/></svg>;if(name==="mail")return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;if(name==="card")return <svg {...common}><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9h19M7 15h3"/></svg>;if(name==="folder")return <svg {...common}><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4l2 2h7A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>;return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
export default function SideNav(){const path=usePathname();return <nav className="side-nav"><div className="nav-label">WERKPLEK</div>{nav.map(item=>{const active=item.href==="/dashboard"?path==="/dashboard":path===item.href||path.startsWith(item.href+"/");return <Link key={item.href} href={item.href} className={`side-link${active?" active":""}`}><Icon name={item.icon}/><span>{item.label}</span></Link>})}</nav>}
