"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";

const input = {accountType:"BUSINESS",name:"",companyName:"",email:"",password:"",phone:"",addressLine1:"",postalCode:"",city:"",country:"Nederland",kvkNumber:"",vatNumber:"",website:"",practiceType:""};

export default function Register(){
  const[form,setForm]=useState(input);
  const[error,setError]=useState("");
  const[busy,setBusy]=useState(false);
  const router=useRouter();
  const set=(key:string,value:string)=>setForm(x=>({...x,[key]:value}));

  async function submit(e:React.FormEvent){
    e.preventDefault(); setError(""); setBusy(true);
    try{
      const r=await fetch("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
      const data=await r.json().catch(()=>null);
      if(!r.ok){setError(data?.error||"Registratie mislukt.");return;}
      if(data?.checkoutRequired){
        const checkout=document.createElement("form"); checkout.method="POST"; checkout.action="/api/stripe/checkout";
        const plan=document.createElement("input"); plan.type="hidden"; plan.name="plan"; plan.value=data.plan; checkout.appendChild(plan);
        document.body.appendChild(checkout); checkout.submit(); return;
      }
      router.push("/verifieer-email");
    }catch{setError("Account aanmaken is tijdelijk niet beschikbaar. Probeer het opnieuw.");}
    finally{setBusy(false);}
  }

  const business=form.accountType==="BUSINESS";
  return <main className="auth-page"><section className="auth-side"><div><div className="brand-lockup" style={{padding:0,border:0,color:"#fff"}}><div className="brand-mark" style={{background:"#fff",color:"#17243b"}}>A</div><div><strong>Alimenta</strong><span>PRO</span></div></div><h1>{business?"Een professionele alimentatiepraktijk, één werkplek.":"Jouw alimentatiedossier, helder en professioneel onderbouwd."}</h1><p>{business?"Werk met cliënten, dossiers, documentanalyse, berekeningen en professionele rapportage in één omgeving.":"Maak één persoonlijk dossier voor kinder- en partneralimentatie en houd alle onderbouwing bij elkaar."}</p></div><div><b>{business?"€249 per jaar":"€19,95 per jaar"}</b><br/><small style={{color:"#aeb8ca"}}>{business?"excl. btw · 5 actieve cliëntdossiers inbegrepen":"incl. btw · 1 persoonlijk dossier"}</small></div></section><section className="auth-card-wrap"><div className="auth-card" style={{maxWidth:760}}><h2>Account aanmaken</h2><p>Kies eerst het type account. Betaling volgt direct na registratie.</p>{error&&<div className="notice error topgap">{error}</div>}<form onSubmit={submit} className="topgap"><div className="form-grid"><div className="full"><label className="label">Type account</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button type="button" className={`btn ${business?"":"secondary"}`} onClick={()=>set("accountType","BUSINESS")}>Zakelijk · €249/jaar</button><button type="button" className={`btn ${!business?"":"secondary"}`} onClick={()=>set("accountType","PRIVATE")}>Particulier · €19,95/jaar</button></div></div><div><label className="label">Naam *</label><input className="input" required value={form.name} onChange={e=>set("name",e.target.value)}/></div><div><label className="label">E-mailadres *</label><input className="input" type="email" required value={form.email} onChange={e=>set("email",e.target.value)}/></div><div><label className="label">Telefoon</label><input className="input" value={form.phone} onChange={e=>set("phone",e.target.value)}/></div><div><label className="label">Wachtwoord *</label><input className="input" type="password" minLength={12} required value={form.password} onChange={e=>set("password",e.target.value)}/><small className="muted">Minimaal 12 tekens.</small></div><div className="full"><h3 className="panel-title">Adres</h3></div><div className="full"><label className="label">Adres *</label><input className="input" required value={form.addressLine1} onChange={e=>set("addressLine1",e.target.value)} placeholder="Straat en huisnummer"/></div><div><label className="label">Postcode *</label><input className="input" required value={form.postalCode} onChange={e=>set("postalCode",e.target.value)}/></div><div><label className="label">Plaats *</label><input className="input" required value={form.city} onChange={e=>set("city",e.target.value)}/></div>{business&&<><div className="full"><h3 className="panel-title">Praktijkgegevens</h3></div><div><label className="label">Kantoornaam *</label><input className="input" required value={form.companyName} onChange={e=>set("companyName",e.target.value)}/></div><div><label className="label">KvK-nummer *</label><input className="input" required value={form.kvkNumber} onChange={e=>set("kvkNumber",e.target.value)}/></div><div><label className="label">Btw-id</label><input className="input" value={form.vatNumber} onChange={e=>set("vatNumber",e.target.value)}/></div><div><label className="label">Website</label><input className="input" type="url" value={form.website} onChange={e=>set("website",e.target.value)}/></div><div><label className="label">Praktijktype</label><select className="input" value={form.practiceType} onChange={e=>set("practiceType",e.target.value)}><option value="">Kies...</option><option>Advocaat</option><option>Advocatenkantoor</option><option>Mediator</option><option>Financieel adviseur</option><option>Anders</option></select></div></>}</div><div className="notice topgap">Na het aanmaken word je direct naar de beveiligde betaalomgeving gestuurd. Zonder betaling wordt geen gratis abonnement geactiveerd.</div><button className="btn topgap" disabled={busy} style={{width:"100%",justifyContent:"center"}}>{busy?"Registratie starten…":`Doorgaan naar betaling →`}</button></form><p className="topgap">Heb je al een account? <Link href="/login" style={{color:"#315efb",fontWeight:700}}>Inloggen</Link></p></div></section></main>
}
