import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildClientExport, eraseClientData, hashToken, randomToken } from "@/lib/privacy";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { clientId } = await req.json();
    const client = await db.client.findFirst({ where: { id: String(clientId || ""), userId: user.id, status: "ACTIVE" } });
    if (!client) return new NextResponse("Cliënt niet gevonden", { status: 404 });
    const raw = randomToken();
    const request = await db.privacyRequest.create({ data: { userId:user.id, clientId:client.id, type:"PORTAL", status:"PENDING", verificationHash:hashToken(raw), expiresAt:new Date(Date.now()+7*24*60*60*1000) } });
    await db.auditLog.create({ data:{userId:user.id,action:"PRIVACY_PORTAL_CREATED",metadata:{clientId:client.id,requestId:request.id}} });
    return NextResponse.json({ok:true,url:`${new URL(req.url).origin}/privacy/client/${raw}`,expiresAt:request.expiresAt});
  } catch(e:any){return new NextResponse(e?.message||"Privacy link mislukt",{status:400});}
}
export async function GET(req:Request){
 const token=new URL(req.url).searchParams.get("token")||"";
 if(!token)return new NextResponse("Ongeldige link",{status:400});
 const pr=await db.privacyRequest.findFirst({where:{verificationHash:hashToken(token),type:"PORTAL",status:"PENDING"},include:{client:{select:{name:true,email:true,reference:true}}}});
 if(!pr||!pr.client||(pr.expiresAt&&pr.expiresAt<new Date()))return new NextResponse("Link ongeldig of verlopen",{status:410});
 return NextResponse.json({name:pr.client.name,email:pr.client.email,reference:pr.client.reference,expiresAt:pr.expiresAt},{headers:{"cache-control":"no-store"}});
}
export async function PATCH(req:Request){
 try{const body:any=await req.json();const token=String(body?.token||"");const action=String(body?.action||"").toUpperCase();const pr=await db.privacyRequest.findFirst({where:{verificationHash:hashToken(token),type:"PORTAL",status:"PENDING"}});if(!pr||!pr.clientId||(pr.expiresAt&&pr.expiresAt<new Date()))return new NextResponse("Link ongeldig of verlopen",{status:410});if(!["ACCESS","ERASURE"].includes(action))return new NextResponse("Ongeldige actie",{status:422});const data=await buildClientExport(pr.userId,pr.clientId);if(!data)return new NextResponse("Gegevens niet gevonden",{status:404});await db.privacyRequest.update({where:{id:pr.id},data:{status:"COMPLETED",verifiedAt:new Date(),completedAt:new Date(),notes:action==="ERASURE"?"Eenmalige privacy-link; export gevolgd door operationele verwijdering.":"Inzage/dataportabiliteit via privacy-link."}});if(action==="ERASURE")await eraseClientData(pr.userId,pr.clientId);return new Response(JSON.stringify(data),{status:200,headers:{"content-type":"application/json; charset=utf-8","content-disposition":`attachment; filename="alimenta-pro-avg-export-${pr.clientId}.json"`,"cache-control":"no-store"}});}catch(e:any){return new NextResponse(e?.message||"Privacyverzoek mislukt",{status:400});}
}
