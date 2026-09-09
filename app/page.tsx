import Link from "next/link";
import { PRICING } from "@/lib/pricing";

const featureItems = [
  ["01", "Één rekenkern", "Berekening, onderbouwing en rapport vertrekken vanuit hetzelfde vastgelegde resultaat."],
  ["02", "Onderbouwing per stap", "Maak invoer, afgeleide bedragen, overrides en bronnen inzichtelijk voor iedere berekening."],
  ["03", "Ondernemersinkomen", "Ondersteun inkomen uit onderneming voor zowel kinder- als partneralimentatie."],
  ["04", "Professionele rapporten", "Een strak rapport met samenvatting, financiële analyse en controleerbare rekenbijlage."],
  ["05", "Dossiers met klantnummer", "Iedere klant krijgt automatisch een uniek klantnummer van zes cijfers."],
  ["06", "Controle & audit", "Versies, wijzigingen, rapportmomenten en beheeracties blijven traceerbaar."],
] as const;

export default function Home() {
  return (
    <main className="al-public">
      <header className="al-nav">
        <div className="al-container" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:24}}>
          <Link href="/" className="al-brand" aria-label="Alimenta Pro home">
            <span className="al-mark">A</span><span>Alimenta <span style={{color:"var(--al-gold)"}}>PRO</span></span>
          </Link>
          <nav className="al-navlinks" aria-label="Hoofdnavigatie">
            <Link href="#functionaliteit">Functionaliteit</Link>
            <Link href="#ondernemers">Ondernemers</Link>
            <Link href="#prijzen">Prijzen</Link>
          </nav>
          <div className="al-nav-actions">
            <Link href="/login" className="al-btn al-btn-secondary">Inloggen</Link>
            <Link href="/register" className="al-btn al-btn-primary">Gratis proberen</Link>
          </div>
        </div>
      </header>

      <section className="al-hero">
        <div className="al-container al-hero-grid">
          <div>
            <div className="al-eyebrow">Professionele alimentatiesoftware</div>
            <h1>Van dossier naar een <span className="al-gradient">onderbouwde uitkomst.</span></h1>
            <p className="al-lead">Alimenta Pro brengt cliënten, berekeningen, ondernemersinkomen en professionele rapportage samen in één rustige werkomgeving voor advocaten, mediators en financieel adviseurs.</p>
            <div className="al-actions">
              <Link href="/register" className="al-btn al-btn-primary">Start gratis proefperiode →</Link>
              <Link href="/pricing" className="al-btn al-btn-secondary">Bekijk abonnementen</Link>
            </div>
            <div className="al-proof"><span>Transparante onderbouwing</span><span>Versiehistorie</span><span>PDF-ready rapporten</span><span>EU-data</span></div>
          </div>
          <div className="al-hero-card">
            <div className="al-card-inner">
              <div className="al-card-head"><div><div className="al-card-kicker">Berekening · definitief</div><div className="al-card-title">Kinder- en partneralimentatie</div></div><span className="al-pill">Versie 4</span></div>
              <div className="al-rows">
                <div className="al-row"><span>Netto besteedbaar inkomen samen</span><strong>€ 6.480 / mnd</strong></div>
                <div className="al-row"><span>Eigen aandeel kosten kinderen</span><strong>€ 1.132 / mnd</strong></div>
                <div className="al-row"><span>Kinderalimentatie</span><strong className="highlight">€ 486 / mnd</strong></div>
                <div className="al-row"><span>Partneralimentatie</span><strong className="highlight">€ 742 / mnd</strong></div>
              </div>
              <div className="al-origin"><div className="al-origin-title">Herkomst van bedragen</div><div className="al-tags"><span className="al-tag">Ingevoerd</span><span className="al-tag">Berekend</span><span className="al-tag gold">Handmatig vastgesteld</span></div><div className="al-card-note">Rekenkern · parameterset · rapport gekoppeld aan versie 4</div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="functionaliteit" className="al-section alt">
        <div className="al-container">
          <div className="al-section-head"><div className="al-eyebrow">Functionaliteit</div><h2>Niet alleen het bedrag. Ook het verhaal erachter.</h2><p>De interface is ontworpen rond één centrale vraag: waar komt dit bedrag vandaan?</p></div>
          <div className="al-grid-3">{featureItems.map(([n,title,text])=><article className="al-feature" key={n}><div className="al-feature-num">{n}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="al-section">
        <div className="al-container">
          <div className="al-section-head"><div className="al-eyebrow">Werkwijze</div><h2>Een vaste route van intake tot rapport.</h2><p>Rust, overzicht en controle in ieder dossier.</p></div>
          <div className="al-workflow">
            {[['01','Dossier aanmaken','Leg de klant vast en laat het platform automatisch een uniek klantnummer uitgeven.'],['02','Gegevens invoeren','Inkomen, wonen, kinderen, zorgverdeling en onderneming waar nodig.'],['03','Berekenen & controleren','Bekijk de onderbouwing, pas gegevens aan en maak een nieuwe versie.'],['04','Rapport uitbrengen','Genereer een rapport dat exact aan de vastgelegde berekening is gekoppeld.']].map(([n,t,p])=><div className="al-step" key={n}><div className="al-step-num">{n}</div><h3>{t}</h3><p>{p}</p></div>)}
          </div>
        </div>
      </section>

      <section id="ondernemers" className="al-section alt">
        <div className="al-container al-entrepreneur">
          <div><div className="al-eyebrow">Ondernemers</div><h2 style={{fontSize:'clamp(30px,4vw,45px)',lineHeight:1.08,letterSpacing:'-1.5px'}}>Inkomen uit onderneming, expliciet onderbouwd.</h2><p className="al-lead" style={{fontSize:15,marginTop:18}}>Bij ondernemers zit de discussie vaak in de cijfers. Daarom wordt de onderneming afzonderlijk inzichtelijk gemaakt en wordt vastgelegd welke grondslag voor de berekening wordt gebruikt.</p><ul className="al-list"><li>Omzet, kosten en afschrijvingen per boekjaar</li><li>Normalisaties en bijtellingen met toelichting</li><li>Privégebruik en geschatte belasting- en premielast</li><li>Loon DGA of privé-onttrekkingen als afzonderlijke gegevens</li><li>Ondersteuning voor kinder- én partneralimentatie</li></ul></div>
          <div className="al-income"><h3>Voorbeeld: van jaarcijfers naar beschikbaar inkomen</h3><div className="al-income-line"><span>Omzet</span><strong>€ 214.500</strong></div><div className="al-income-line"><span>Bedrijfskosten</span><strong>− € 138.200</strong></div><div className="al-income-line"><span>Afschrijvingen</span><strong>− € 12.400</strong></div><div className="al-income-line"><span>Normalisaties</span><strong>+ € 6.800</strong></div><div className="al-income-line"><span>Geschatte belasting en premies</span><strong>− € 21.300</strong></div><div className="al-income-total"><span>Beschikbaar inkomen</span><strong>€ 4.117 / mnd</strong></div><p className="al-card-note" style={{marginTop:14}}>Voorbeeldbedragen. De gebruikte grondslag en eventuele professionele keuzes worden per berekening vastgelegd.</p></div>
        </div>
      </section>

      <section id="prijzen" className="al-section">
        <div className="al-container">
          <div className="al-section-head"><div className="al-eyebrow">Prijzen</div><h2>Een plan dat past bij je praktijk.</h2><p>Professionele functies, duidelijke grenzen en ruimte om door te groeien.</p></div>
          <div className="al-price-grid">{Object.entries(PRICING).map(([key,p],i)=><article className={`al-price ${i===1?'featured':''}`} key={key}><div className="al-price-name">{p.name}</div><div className="al-price-amount">€{p.annual}<small> / jaar</small></div><p>{p.description}</p><ul><li>{p.includedClients===999999?'Onbeperkt eigen cliënten':`${p.includedClients} eigen cliënten inbegrepen`}</li><li>Berekeningen en rapportage</li><li>Versiehistorie en onderbouwing</li></ul><Link href="/register" className="al-btn al-btn-primary" style={{width:'100%'}}>Kies dit plan</Link></article>)}</div>
        </div>
      </section>

      <section className="al-section alt"><div className="al-container" style={{textAlign:'center'}}><div className="al-eyebrow">Klaar voor je volgende dossier?</div><h2 style={{fontSize:'clamp(32px,4vw,50px)',letterSpacing:'-1.8px',margin:'16px auto',maxWidth:720}}>Professionele alimentatiesoftware zonder onnodige ruis.</h2><p className="al-lead" style={{margin:'0 auto',fontSize:15}}>Begin met een dossier en ervaar hoe invoer, berekening, onderbouwing en rapportage samenkomen.</p><div className="al-actions" style={{justifyContent:'center'}}><Link href="/register" className="al-btn al-btn-primary">Account aanmaken →</Link><Link href="/login" className="al-btn al-btn-secondary">Inloggen</Link></div></div></section>

      <footer className="al-footer"><div className="al-container al-footer-grid"><div>© {new Date().getFullYear()} Alimenta Pro · Professionele software voor alimentatieprofessionals.</div><div className="al-disclaimer">Alimenta Pro is rekensoftware. De gebruiker blijft verantwoordelijk voor de juridische beoordeling en toepassing van de uitkomsten.</div></div></footer>
    </main>
  );
}
