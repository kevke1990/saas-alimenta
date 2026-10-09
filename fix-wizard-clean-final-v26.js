const fs = require('fs');

let content = fs.readFileSync('app/cases/[id]/edit/wizard/page.tsx', 'utf8');

content = content.replace(
  'const [data, setData] = useState<any>(null);',
  'const [data, setData] = useState<any>(null);\n  const [step, setStep] = useState(1);'
);

const headerEnd = `      <div className="actions">
        <Link className="btn secondary" href={\`/cases/\${id}\`}>
          Annuleren
        </Link>
        <button className="btn" disabled={disabled} onClick={save}>
          {busy ? "Herberekenen…" : "Opslaan & herberekenen"}
        </button>
      </div>
    </div>`;

const injectTabs = `      <div className="actions">
        <Link className="btn secondary" href={\`/cases/\${id}\`}>
          Annuleren
        </Link>
        <button className="btn" disabled={disabled} onClick={save}>
          {busy ? "Herberekenen…" : "Opslaan & herberekenen"}
        </button>
      </div>
    </div>
    <div className="wizard-progress" style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
      {[
        { num: 1, label: "Dossier & Peildatum" },
        { num: 2, label: "Ouders & Inkomsten" },
        { num: 3, label: "Wonen & Gezin" },
        { num: 4, label: "Kinderen" },
        { num: 5, label: "Partneralimentatie" },
      ].map((s) => (
        <button
          key={s.num}
          type="button"
          onClick={() => setStep(s.num)}
          className={\`btn \${step === s.num ? '' : 'secondary'}\`}
          style={{ whiteSpace: 'nowrap', borderRadius: '99px', padding: '6px 14px', fontSize: '11px' }}
        >
          {s.num}. {s.label}
        </button>
      ))}
    </div>
    <div className="wizard-container" data-step={step} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '14px', boxShadow: 'var(--shadow)' }}>`;

content = content.replace(headerEnd, injectTabs);

let count = 0;
content = content.replace(/className="panel topgap"/g, () => {
    count++;
    let targetStep = 1;
    if (count === 3 || count === 4) targetStep = 2;
    if (count === 5 || count === 6) targetStep = 3;
    if (count === 7) targetStep = 4;
    if (count === 8) targetStep = 5;

    return `className={"panel topgap wizard-step step-" + ${targetStep}}`;
});

content = content.replace(/<h2 className="panel-title">/g, '<h2 className="panel-title big-title">');

const footerRegex = /<div className="actions topgap">\s*<button className="btn" disabled=\{disabled\} onClick=\{save\}>\s*\{busy \? "Herberekenen…" : "Opslaan & herberekenen"\}\s*<\/button>\s*<Link className="btn secondary" href=\{\`\/cases\/\$\{id\}\`\}>\s*Annuleren\s*<\/Link>\s*<\/div>\s*<\/main>\s*\);\s*\}/g;

content = content.replace(
  footerRegex,
  `<div className="wizard-actions" style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 30px', borderTop: '1px solid var(--line)', background: '#fff', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
          <button type="button" className="btn secondary" disabled={step === 1 || busy} onClick={() => setStep((s) => Math.max(1, s - 1))}>
            ← Vorige
          </button>
          {step < 5 ? (
            <button type="button" className="btn" onClick={() => setStep((s) => Math.min(5, s + 1))}>
              Volgende →
            </button>
          ) : (
            <button className="btn" disabled={disabled} onClick={save}>
              {busy ? "Herberekenen…" : "Opslaan & herberekenen"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}`
);

fs.writeFileSync('app/cases/[id]/edit/wizard/page.tsx', content);

let globals = fs.readFileSync('app/globals.css', 'utf8');
if (!globals.includes('.wizard-step { display: none')) {
  globals += `\n/* Wizard steps logic */
.wizard-step { display: none !important; }
.wizard-container[data-step="1"] .wizard-step.step-1,
.wizard-container[data-step="2"] .wizard-step.step-2,
.wizard-container[data-step="3"] .wizard-step.step-3,
.wizard-container[data-step="4"] .wizard-step.step-4,
.wizard-container[data-step="5"] .wizard-step.step-5 {
  display: block !important;
  padding: 28px 30px;
  border-radius: 0;
  box-shadow: none;
  border-bottom: 0;
  margin-top: 0;
  border: 0;
}
.wizard-container[data-step="1"] .wizard-step.step-1:nth-of-type(1),
.wizard-container[data-step="2"] .wizard-step.step-2:nth-of-type(3),
.wizard-container[data-step="3"] .wizard-step.step-3:nth-of-type(5),
.wizard-container[data-step="4"] .wizard-step.step-4:nth-of-type(7),
.wizard-container[data-step="5"] .wizard-step.step-5:nth-of-type(8) {
  border-top: 1px solid var(--line);
}
`;
  fs.writeFileSync('app/globals.css', globals);
}
