"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function ArchiveClientButton({clientId,clientName,status}:{clientId:string;clientName:string;status:"ACTIVE"|"ARCHIVED"}){
 const [busy,setBusy]=useState(false); const router=useRouter();
 async function toggle(){if(!confirm(status==="ACTIVE"?`Cliënt ${clientName} archiveren? Dossiers blijven bewaard.`:`Cliënt ${clientName} weer activeren?`))return;setBusy(true);try{const r=await fetch(`/api/clients/${clientId}/archive`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:status==="ACTIVE"?"ARCHIVED":"ACTIVE"})});if(!r.ok)throw new Error(await r.text());router.refresh();}catch(e:any){alert(e.message||"Archiveren mislukt.");}finally{setBusy(false);}}
 return <button className="btn secondary" type="button" onClick={toggle} disabled={busy}>{busy?"Bezig…":status==="ACTIVE"?"Archiveren":"Activeren"}</button>;
}
