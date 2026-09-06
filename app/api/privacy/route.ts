import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildClientExport, eraseClientData, PRIVACY_POLICY_VERSION } from "@/lib/privacy";

export async function GET(req:Request) {
  try {
    const u=await requireUser(); const id=new URL(req.url).searchParams.get("clientId");
    if(!id) return new NextResponse("clientId verplicht",{status:400});
    const data=await buildClientExport(u.id,id); if(!data)return new NextResponse("Cliënt niet gevonden",{status:404});
    return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
  } catch(e:any){return new NextResponse(e?.message||"Privacy export mislukt",{status:400});}
}

export async function DELETE(req:Request) {
  try {
    const u=await requireUser(); const body:any=await req.json(); const id=String(body?.clientId||"");
    if(!id || body?.confirm!="DELETE") return new NextResponse("Bevestiging ontbreekt",{status:422});
    const exportData=await buildClientExport(u.id,id); if(!exportData)return new NextResponse("Cliënt niet gevonden",{status:404});
    await db.privacyRequest.create({data:{userId:u.id,clientId:id,type:"ERASURE",status:"COMPLETED",verifiedAt:new Date(),completedAt:new Date(),notes:"Eenmalige export gevolgd door verwijdering op verzoek van betrokkene."}});
    const erased=await eraseClientData(u.id,id); if(!erased)return new NextResponse("Cliënt niet gevonden",{status:404});
    return new Response(JSON.stringify({exportData,privacyPolicyVersion:PRIVACY_POLICY_VERSION}),{status:200,headers:{"content-type":"application/json; charset=utf-8","content-disposition":`attachment; filename="alimenta-pro-avg-export-${id}.json"`,"cache-control":"no-store"}});
  } catch(e:any){return new NextResponse(e?.message||"Verwijdering mislukt",{status:400});}
}
