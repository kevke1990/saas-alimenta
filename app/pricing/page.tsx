import Link from "next/link";
import { PRICING } from "@/lib/pricing";

const included = [
  {
    title: "Rekenen",
    items: ["Kinderalimentatie", "Partneralimentatie", "Onderbouwing per stap", "Bestaande rekenkern als bron van waarheid"],
  },
  {
    title: "Vastleggen",
    items: ["Cliëntdossiers", "Versiehistorie", "Wijzigingen en professionele keuzes", "Audittrail"],
  },
  {
    title: "Uitbrengen",
    items: ["Professionele rapportage", "Rapport gekoppeld aan berekening", "Documenten", "Controleerbare rekenbijlage"],
  },
] as const;

const faqItems = [
  ["Wat kost Alimenta?", "Alimenta heeft momenteel twee productvormen. De actuele bedragen en btw-behandeling komen rechtstreeks uit de bestaande productcatalogus in de applicatie."],
  ["Wat is inbegrepen?", "Beide productvormen gebruiken dezelfde kernfunctionaliteit voor berekeningen en rapportage. Het zakelijke plan bevat daarnaast meerdere actieve cliëntdossiers."],
  ["Is er een gratis plan?", "Nee. De huidige productopzet werkt met een betaald Particulier- of Zakelijk-account en stuurt registratie door naar de bestaande betaalflow."],
  ["Kan ik mijn abonnement wijzigen?", "Wijzigingen en betaling blijven onderdeel van de bestaande billing- en Stripe-flow. Deze pagina bevat alleen de presentatie van de plannen."],
] as const;

export default function PricingPage() {
  return (
    <main className="al-public">
      <header className="al-nav">
        <div className="al-container" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:24}}>
          <Link href="/" className="al-brand" aria-label="Alimenta Pro home">
            <span className="al-mark">A</span>
            <span>Alimenta <span style={{color:"var(--al-gold)"}}>PRO</span></span>
          </Link>
          <nav className="al-navlinks" aria-label="Hoofdnavigatie">
            <Link href="/">Home</Link>
            <Link href="/#functionaliteit">Functionaliteit</Link>
            <Link href="/#werkwijze">Werkwijze</Link>
            <Link href="/#ondernemers">Ondernemers</Link>
            <Link href="/pricing" aria-current="page">Prijzen</Link>
            <Link href="/#faq">FAQ</Link>
          </nav>
          <div className="al-nav-actions">
            <Link href="/login" className="al-btn al-btn-secondary">Inloggen</Link>
            <Link href="/register" className="al-btn al-btn-primary">Account aanmaken</Link>
          </div>
        </div>
      </header>

      <section className="al-hero al-pricing-hero">
        <div className="al-container al-pricing-hero-inner">
          <div className="al-eyebrow">Prijzen</div>
          <h1>Twee duidelijke productvormen.</h1>
          <p className="al-lead">Kies Particulier voor één persoonlijk dossier of Zakelijk voor een professionele praktijk. De bedragen hieronder worden uit de bestaande productcatalogus gelezen.</p>
          <div className="al-proof al-proof-centered">
            <span>Jaarprijzen</span>
            <span>Transparante btw-behandeling</span>
            <span>Betaling via bestaande flow</span>
          </div>
        </div>
      </section>

      <section className="al-section">
        <div className="al-container">
          <div className="al-price-grid al-two">
            {Object.entries(PRICING).map(([key,p]) => (
              <article className={`al-price ${key === 'pro' ? 'featured' : ''}`} key={key}>
                <div className="al-price-name">{p.name}</div>
                <div className="al-price-amount">€{p.annual.toLocaleString('nl-NL',{minimumFractionDigits:2})}<small> / jaar</small></div>
                <p>{p.description}</p>
                <div className="al-card-note">{p.vatLabel}</div>
                <ul>
                  <li>{p.includedClients === 1 ? '1 persoonlijk dossier' : `${p.includedClients} actieve cliëntdossiers inbegrepen`}</li>
                  <li>Berekeningen en rapportage</li>
                  <li>Documenten en audittrail</li>
                  <li>Versiehistorie</li>
                </ul>
                <Link href={`/register?type=${key === 'private' ? 'private' : 'business'}`} className="al-btn al-btn-primary" style={{width:'100%'}}>Kies {p.name} →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="al-section alt">
        <div className="al-container">
          <div className="al-section-head">
            <div className="al-eyebrow">Inbegrepen</div>
            <h2>Dezelfde professionele basis, helder gepresenteerd.</h2>
            <p>De UI volgt de Lovable-informatiearchitectuur, terwijl de bestaande product- en backendcontracten leidend blijven.</p>
          </div>
          <div className="al-grid-3">
            {included.map((column) => (
              <article className="al-feature" key={column.title}>
                <h3>{column.title}</h3>
                <ul className="al-list">
                  {column.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="al-section">
        <div className="al-container al-faq-container">
          <div className="al-section-head">
            <div className="al-eyebrow">Veelgestelde vragen</div>
            <h2>Prijzen en abonnementen.</h2>
            <p>Praktische antwoorden zonder nieuwe billinglogica in de publieke UI.</p>
          </div>
          <div className="al-faq-list">
            {faqItems.map(([question,answer], index) => (
              <details className="al-faq" key={question} open={index === 0}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="al-section alt">
        <div className="al-container al-final-cta">
          <div className="al-eyebrow">Starten</div>
          <h2>Kies je account en ga verder met de bestaande registratieflow.</h2>
          <p className="al-lead">Na registratie blijft de bestaande betaal- en entitlementlogica verantwoordelijk voor toegang en abonnementen.</p>
          <div className="al-actions" style={{justifyContent:'center'}}>
            <Link href="/register?type=private" className="al-btn al-btn-secondary">Particulier</Link>
            <Link href="/register?type=business" className="al-btn al-btn-primary">Zakelijk →</Link>
          </div>
        </div>
      </section>

      <footer className="al-footer">
        <div className="al-container al-footer-grid">
          <div>© {new Date().getFullYear()} Alimenta Pro</div>
          <div className="al-disclaimer">Alimenta Pro is rekensoftware. De gebruiker blijft verantwoordelijk voor de juridische beoordeling en toepassing van de uitkomsten.</div>
        </div>
      </footer>
    </main>
  );
}
