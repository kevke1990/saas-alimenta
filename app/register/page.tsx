"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";

export default function Register(){
  const[form,setForm]=useState({name:"",companyName:"",email:"",password:""});
  const[error,setError]=useState("");
  const[busy,setBusy]=useState(false);
  const router=useRouter();

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setError("");
    setBusy(true);
    try{
      const r=await fetch("/api/auth/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});
      if(r.ok){
        router.push("/verifieer-email");
        return;
      }
      setError(await r.text());
    }catch{
      setError("Account aanmaken is tijdelijk niet beschikbaar. Probeer het opnieuw.");
    }finally{
      setBusy(false);
    }
  }

  return <main className="auth-page"><section className="auth-side"><div><div className="brand-lockup" style={{padding:0,border:0,color:"#fff"}}><div className="brand-mark" style={{background:"#fff",color:"#17243b"}}>A</div><div><strong>Alimenta</strong><span>PRO</span></div></div><h1>Bouw aan een professionele alimentatiepraktijk.</h1><p>Werk met duidelijke dossiers, herhaalbare berekeningen en rapportage in je eigen professionele omgeving.</p></div><small style={{color:"#7f8ba0"}}>Start met het gratis plan.</small></section><section className="auth-card-wrap"><div className="auth-card"><h2>Account aanmaken</h2><p>Maak je professionele werkplek aan.</p>{error&&<div className="notice error topgap">{error}</div>}<form onSubmit={submit} className="topgap">{[["name","Naam"],["companyName","Kantoornaam"],["email","E-mailadres"]].map(([k,l])=><div key={k}><label className="label">{l}</label><input className="input" required value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>)}<div><label className="label">Wachtwoord</label><input className="input" type="password" minLength={12} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><small className="muted">Minimaal 12 tekens.</small></div><button className="btn" disabled={busy} style={{width:"100%",justifyContent:"center"}}>{busy?"Bezig…":"Account maken"}</button></form><p className="topgap">Heb je al een account? <Link href="/login" style={{color:"#315efb",fontWeight:700}}>Inloggen</Link></p></div></section></main>
}