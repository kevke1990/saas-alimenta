import { requireUser } from "@/lib/auth";
import { getTeam } from "@/lib/team-security";

export default async function TeamPage() {
  const user = await requireUser();
  const { tenant, members } = await getTeam(user);
  return (
    <div className="content" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Organisatie · team</div>
          <h1 className="page-title">{tenant.name}</h1>
          <p className="page-subtitle">Beheer gebruikers en organisatierollen. Dossierrechten blijven afzonderlijk afgeschermd.</p>
        </div>
      </div>
      <div className="panel topgap">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Teamleden</h2>
            <div className="panel-sub">Geregistreerde gebruikers binnen deze organisatie</div>
          </div>
        </div>
        <div className="table-wrap topgap">
          <table className="table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.userId}>
                  <td><b>{m.name || "—"}</b></td>
                  <td>{m.email}</td>
                  <td><span className="status green">{m.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
