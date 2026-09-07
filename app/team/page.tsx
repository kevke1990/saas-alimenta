import { requireUser } from "@/lib/auth";
import { getTeam } from "@/lib/team-security";

export default async function TeamPage() {
  const user = await requireUser();
  const { tenant, members } = await getTeam(user);
  return <main className="container"><div className="eyebrow">Organisatie · team</div><h1 className="page-title">{tenant.name}</h1><p className="page-subtitle">Beheer gebruikers en organisatierollen. Dossierrechten blijven afzonderlijk afgeschermd.</p><div className="billing-info topgap"><h2>Teamleden</h2><div>{members.map(m => <div key={m.userId} style={{display:"flex",justifyContent:"space-between",gap:16,padding:"14px 0",borderBottom:"1px solid var(--border,#ddd)"}}><div><b>{m.name || m.email}</b><div>{m.email}</div></div><span>{m.role}</span></div>)}</div></div></main>;
}
