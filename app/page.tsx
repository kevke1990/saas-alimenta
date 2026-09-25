import Link from "next/link";
import { PRICING } from "@/lib/pricing";
import { MereloLogo } from "@/components/Brand";

const featureItems = [
  ["01", "Één rekenkern, geen losse varianten", "Editor, onderbouwing en rapport vertrekken vanuit hetzelfde vastgelegde resultaat."],
  ["02", "Onderbouwing per stap", "Van netto besteedbaar inkomen tot zorgkorting: invoer, tussenbedragen en herkomst blijven zichtbaar."],
  ["03", "Ondernemersinkomen", "Werk met ondernemingsgegevens en professionele keuzes zonder een tweede rekenlogica naast de bestaande engine."],
  ["04", "Rapporten om te delen", "Een professioneel rapport met samenvatting, financiële analyse en controleerbare rekenbijlage."],
  ["05", "Dossiers met klantnummer", "Cliëntgegevens, berekeningen, documenten en historie bij elkaar in één werkplek."],
  ["06", "Controle en audit", "Versies, wijzigingen, rapportmomenten en beheeracties blijven traceerbaar."],
] as const;

const workflowItems = [
  ["01", "Dossier aanmaken", "Leg de cliënt en de uitgangssituatie vast."],
  ["02", "Gegevens invoeren", "Inkomen, wonen, kinderen en zorgverdeling worden gestructureerd vastgelegd."],
  ["03", "Berekenen en controleren", "Bekijk de onderbouwing en leg wijzigingen als nieuwe versie vast."],
  ["04", "Rapport uitbrengen", "Genereer rapportage vanuit het vastgelegde rekenresultaat."],
] as const;

const faqItems = [
  ["Welke berekeningen ondersteunt Merelo?", "Merelo ondersteunt kinder- en partneralimentatie binnen de bestaande rekenkern, inclusief de relevante onderbouwing en professionele rapportage."],
  ["Kan ik zien waar een bedrag vandaan komt?", "Ja. De publieke productbelofte is juist gericht op herleidbaarheid: invoer, afgeleide bedragen, professionele keuzes en versies worden afzonderlijk zichtbaar gemaakt waar de applicatie dat ondersteunt."],
  ["Is Merelo juridisch advies?", "Nee. Merelo is rekensoftware. De gebruiker blijft verantwoordelijk voor de juridische beoordeling, gekozen uitgangspunten en toepassing van de uitkomst."],
  ["Wat gebeurt er met mijn berekening?", "Berekeningen blijven gekoppeld aan de bestaande server-side applicatie, autorisatie, tenant-isolatie en opslag. Deze publieke pagina introduceert daar geen nieuwe datalaag voor."],
] as const;

export default function Home() {
  return (
    <main className="al-public">
      <header className="al-nav">
        <div className="al-container al-nav-inner">
          <MereloLogo />
          <nav className="al-navlinks" aria-label="Hoofdnavigatie">
            <Link href="#functionaliteit">Functionaliteit</Link><Link href="#werkwijze">Werkwijze</Link><Link href="#ondernemers">Ondernemers</Link><Link href="#prijzen">Prijzen</Link><Link href="#faq">FAQ</Link>
          </nav>
          <div className="al-nav-actions"><Link href="/login" className="al-btn al-btn-secondary">Inloggen</Link><Link href="/register" className="al-btn al-btn-primary">Account aanmaken</Link></div>
        </div>
      </header>

      <section className="al-hero">
        <div className="al-container al-hero-grid">
          <div>
            <div className="al-eyebrow">Voor advocaten, mediators en financieel adviseurs</div>
            <h1>Merelotie berekenen met een <span className="al-gradient">onderbouwing die standhoudt.</span></h1>
            <p className="al-lead">
              Eén bestaande rekenkern voor kinder- en partneralimentatie. Elke uitkomst is stap voor stap
              herleidbaar en rapportage blijft gekoppeld aan het vastgelegde resultaat.
            </p>
            <div className="al-actions">
              <Link href="/register" className="al-btn al-btn-primary">Account aanmaken →</Link>
              <Link href="/pricing" className="al-btn al-btn-secondary">Bekijk prijzen</Link>
            </div>
            <div className="al-proof">
              <span>Onderbouwing per stap</span>
              <span>Versiehistorie</span>
              <span>Professionele rapportage</span>
              <span>EU-data</span>
            </div>
          </div>

          <div className="al-hero-card">
            <div className="al-card-inner">
              <div className="al-card-head">
                <div>
                  <div className="al-card-kicker">Berekening · illustratie</div>
                  <div className="al-card-title">Kinder- en partneralimentatie</div>
                </div>
                <span className="al-pill">Versie 4</span>
              </div>
              <div className="al-rows">
                <div className="al-row"><span>Netto besteedbaar inkomen samen</span><strong>€ 6.480 / mnd</strong></div>
                <div className="al-row"><span>Eigen aandeel kosten kinderen</span><strong>€ 1.132 / mnd</strong></div>
                <div className="al-row"><span>Kinderalimentatie</span><strong className="highlight">€ 486 / mnd</strong></div>
                <div className="al-row"><span>Partneralimentatie</span><strong className="highlight">€ 742 / mnd</strong></div>
              </div>
              <div className="al-origin">
                <div className="al-origin-title">Herkomst van bedragen</div>
                <div className="al-tags">
                  <span className="al-tag">Ingevoerd</span>
                  <span className="al-tag">Berekend</span>
                  <span className="al-tag gold">Professioneel vastgesteld</span>
                </div>
                <div className="al-card-note">Illustratieve interface. Bedragen zijn voorbeelden en geen advies.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="al-trust-strip" aria-label="Belangrijkste eigenschappen">
        <div className="al-container al-trust-grid">
          <div className="al-trust-item"><strong>Traceerbare parameters</strong><span>Versie en bron blijven aan het rekenmoment gekoppeld.</span></div>
          <div className="al-trust-item"><strong>Versiehistorie</strong><span>Opslagen en wijzigingen blijven onderdeel van het dossier.</span></div>
          <div className="al-trust-item"><strong>Rapport = berekening</strong><span>Rapportage volgt het vastgelegde resultaat.</span></div>
          <div className="al-trust-item"><strong>Zorgvuldig met data</strong><span>De bestaande server-side beveiliging blijft leidend.</span></div>
        </div>
      </section>

      <section id="functionaliteit" className="al-section">
        <div className="al-container">
          <div className="al-section-head">
            <div className="al-eyebrow">Functionaliteit</div>
            <h2>Gebouwd rond de vraag: waar komt dit bedrag vandaan?</h2>
            <p>De UX maakt de weg van invoer naar uitkomst zichtbaar zonder een tweede reken- of datalaag te introduceren.</p>
          </div>
          <div className="al-grid-3">
            {featureItems.map(([n,title,text]) => (
              <article className="al-feature" key={n}>
                <div className="al-feature-num">{n}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="werkwijze" className="al-section alt">
        <div className="al-container">
          <div className="al-section-head">
            <div className="al-eyebrow">Werkwijze</div>
            <h2>Van intake tot rapport in vier stappen.</h2>
            <p>Een vaste route door het dossier, met de bestaande applicatielogica als bron van waarheid.</p>
          </div>
          <ol className="al-workflow">
            {workflowItems.map(([n,title,text]) => (
              <li className="al-step" key={n}>
                <div className="al-step-num">{n}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="ondernemers" className="al-section">
        <div className="al-container al-entrepreneur">
          <div>
            <div className="al-eyebrow">Ondernemers</div>
            <h2 style={{fontSize:'clamp(30px,4vw,45px)',lineHeight:1.08,letterSpacing:'-1.5px'}}>Inkomen uit onderneming, expliciet onderbouwd.</h2>
            <p className="al-lead" style={{fontSize:15,marginTop:18}}>
              De publieke UX laat zien hoe ondernemingsgegevens en professionele keuzes als onderdeel van de
              onderbouwing kunnen worden gepresenteerd. De bestaande server-side income-engine blijft hiervoor leidend.
            </p>
            <ul className="al-list">
              <li>Omzet, bedrijfskosten en afschrijvingen per boekjaar</li>
              <li>Normalisaties en bijtellingen met toelichting</li>
              <li>Privégebruik en geschatte belasting- en premielast</li>
              <li>Professionele beoordeling van de gekozen grondslag</li>
              <li>Herleidbare verwerking in berekening en rapport</li>
            </ul>
          </div>
          <div className="al-income">
            <h3>Van jaarcijfers naar beschikbaar inkomen</h3>
            <div className="al-income-line"><span>Omzet</span><strong>€ 214.500</strong></div>
            <div className="al-income-line"><span>Bedrijfskosten</span><strong>− € 138.200</strong></div>
            <div className="al-income-line"><span>Afschrijvingen</span><strong>− € 12.400</strong></div>
            <div className="al-income-line"><span>Normalisaties / privégebruik</span><strong>+ € 6.800</strong></div>
            <div className="al-income-total"><span>Beschikbaar inkomen</span><strong>Controleerbaar</strong></div>
            <p className="al-card-note" style={{marginTop:14}}>Voorbeeldopbouw; dit zijn geen reële dossiergegevens.</p>
          </div>
        </div>
      </section>

      <section className="al-section alt">
        <div className="al-container">
          <div className="al-section-head">
            <div className="al-eyebrow">Vertrouwen</div>
            <h2>Passend bij een juridische en financiële praktijk.</h2>
            <p>Geen beloftes over uitkomsten, maar controle over het proces: herleidbaar, herhaalbaar en verantwoord vastgelegd.</p>
          </div>
          <div className="al-credibility-grid">
            <article className="al-feature"><h3>Eigen werkplek</h3><p>Cliënten, berekeningen, documenten en rapportage horen bij dezelfde bestaande applicatie- en autorisatielaag.</p></article>
            <article className="al-feature"><h3>Verantwoording achteraf</h3><p>Versies, wijzigingen en rapportmomenten kunnen binnen het bestaande audit- en snapshotmodel worden teruggevonden.</p></article>
            <article className="al-feature"><h3>Server-side beveiliging</h3><p>Deze publieke UI introduceert geen client-side sessie-, tenant-, secret- of rekenlogica.</p></article>
          </div>
        </div>
      </section>

      <section id="prijzen" className="al-section">
        <div className="al-container">
          <div className="al-section-head">
            <div className="al-eyebrow">Prijzen</div>
            <h2>Twee accounts. Eén duidelijke productlijn.</h2>
            <p>Particulier voor één persoonlijk dossier. Zakelijk voor een professionele praktijk.</p>
          </div>
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

      <section id="faq" className="al-section alt">
        <div className="al-container al-faq-container">
          <div className="al-section-head">
            <div className="al-eyebrow">Veelgestelde vragen</div>
            <h2>Wat je van Merelo kunt verwachten.</h2>
            <p>De software ondersteunt het rekenproces; de gebruiker blijft verantwoordelijk voor de juridische beoordeling.</p>
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

      <section className="al-section">
        <div className="al-container al-final-cta">
          <div className="al-eyebrow">Klaar voor je volgende dossier?</div>
          <h2>Professionele alimentatiesoftware zonder onnodige ruis.</h2>
          <p className="al-lead">Kies Particulier of Zakelijk en ga vanuit de bestaande registratieflow verder naar betaling.</p>
          <div className="al-actions" style={{justifyContent:'center'}}>
            <Link href="/register" className="al-btn al-btn-primary">Account aanmaken →</Link>
            <Link href="/login" className="al-btn al-btn-secondary">Inloggen</Link>
          </div>
        </div>
      </section>

      <footer className="al-footer">
        <div className="al-container al-footer-grid">
          <div>© {new Date().getFullYear()} Merelo · Professionele software voor alimentatie.</div>
          <div className="al-disclaimer">Merelo is rekensoftware. De gebruiker blijft verantwoordelijk voor de juridische beoordeling en toepassing van de uitkomsten.</div>
        </div>
      </footer>
    </main>
  );
}
