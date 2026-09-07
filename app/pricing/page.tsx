import Link from "next/link";
import { PRICING } from "@/lib/pricing";

const euro = (value: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);

const features: Record<string, string[]> = {
  pro: ["5 actieve cliëntdossiers inbegrepen", "Extra cliëntdossier: €19,95/jaar", "Volledige alimentatieberekeningen", "Professionele rapportage", "Audit trail en berekeningshistorie"],
  practice20: ["20 actieve cliëntdossiers", "Geen toeslag per extra cliënt", "Team- en praktijkworkflow", "Professionele rapportage", "Audit trail en berekeningshistorie"],
  practice50: ["50 actieve cliëntdossiers", "Geen toeslag per extra cliënt", "Team- en praktijkworkflow", "Professionele rapportage", "Audit trail en berekeningshistorie"],
  enterprise: ["Onbeperkt cliëntdossiers", "Meerdere gebruikers", "Enterprise-inrichting", "API/integraties beschikbaar", "Maatwerk en supportafspraken"],
};

export default function PricingPage() {
  return (
    <main>
      <nav className="public-nav">
        <Link href="/" className="public-brand">Alimenta <span style={{ color: "#315efb", fontSize: 10, letterSpacing: 2 }}>PRO</span></Link>
        <div className="actions"><Link href="/login" className="btn secondary">Inloggen</Link><Link href="/register" className="btn">Starten</Link></div>
      </nav>
      <div className="hero-public">
        <section className="public-hero">
          <div className="eyebrow">Prijzen</div>
          <h1>Professionele software zonder ingewikkelde licenties.</h1>
          <p>Jaarprijzen per professionele account. Kies een plan op basis van het aantal actieve cliëntdossiers. Alle bedragen zijn exclusief btw.</p>
        </section>
        <section className="price-grid">
          {Object.entries(PRICING).map(([key, plan]) => (
            <article className="price-card" key={key}>
              <div className="panel-sub">{plan.name}</div>
              <div className="price topgap">{euro(plan.annual)} <span className="small">/ jaar</span></div>
              <p className="page-subtitle">{plan.description}</p>
              <ul className="topgap" style={{ paddingLeft: 18, lineHeight: 1.9, fontSize: 11 }}>
                {features[key].map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <Link href="/register" className="btn topgap">Start met Alimenta →</Link>
            </article>
          ))}
        </section>
        <section className="panel topgap">
          <h2 className="panel-title">Belangrijk voor de commerciële release</h2>
          <p className="page-subtitle">Stripe Price IDs moeten vóór het accepteren van betalingen in productie aan de overeenkomstige plannen worden gekoppeld. De applicatie behandelt btw, betaalmethode en facturen via de geconfigureerde Stripe-inrichting.</p>
          <p className="page-subtitle topgap">Alimenta Pro ondersteunt professionele besluitvorming, maar levert geen juridisch advies en vervangt geen beoordeling door een bevoegde professional.</p>
        </section>
      </div>
    </main>
  );
}
