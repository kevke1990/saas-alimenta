# Alimenta Pro v0.9.2 — Pre-1.0 UI Foundation

## Wat is verbeterd
- Volledig vernieuwde professionele app-shell met vaste navigatie, werkplekcontext en responsive gedrag.
- Nieuwe Alimenta Pro visuele stijl: rustige juridische/financiële SaaS uitstraling, duidelijke hiërarchie en consistente componenten.
- Dashboard vernieuwd met KPI's, recente dossiers, snelle acties en laatste resultaat.
- Cliëntenoverzicht en cliëntdetail vernieuwd.
- Nieuwe cliënt-flow vernieuwd.
- Dossierdetail vernieuwd met resultaat-KPI's, ouders, kinderen en berekeningshistorie.
- Nieuwe berekening omgezet naar een wizard-achtige workflow met behoud van de bestaande v0.9 rekenengine.
- Publieke homepage, login en registratie vernieuwd.
- Engineversie voor nieuwe opgeslagen Calculation snapshots staat nu op 0.9.2; de normversie blijft afkomstig uit de calculator.
- Nieuwe dossiers nemen de daadwerkelijke `result.normVersion` over als `calculationVersion` in plaats van de oude 6.0.0 waarde.
- `SESSION_SECRET` heeft geen development fallback meer en vereist minimaal 32 tekens.
- Beschadigd leidend backslash-teken in de bestaande admin users API verwijderd.

## Bewust nog niet v1.0
- Gestructureerde invoerformulieren voor de volledige calculator.
- Server-side PDF generator.
- MFA/passkeys.
- Volledig bewerkbare Stripe plans/prices en extra-client billing.
- Volledige audit trail en documentenmodule.
- Client portal.
- Tenant-isolation test suite.
- Prisma migration history.

Deze release is een UI/architectuurfundament richting v1.0 en geen claim dat de calculator juridisch volledig gevalideerd is.
