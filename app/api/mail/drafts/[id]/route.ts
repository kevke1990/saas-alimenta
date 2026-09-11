import {NextResponse} from "next/server";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";

async function ownedDraft(userId:string,id:string){
  return db.mailMessage.findFirst({where:{id,userId,direction:"OUTBOUND",status:"DRAFT"}});
}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const u=await requireUser();const{id}=await params;const draft=await ownedDraft(u.id,id);
    if(!draft)return new NextResponse("Concept niet gevonden.",{status:404});
    const b:any=await req.json();
    const to=Array.isArray(b.to)?b.to.map((v:unknown)=>String(v).trim()).filter(Boolean):undefined;
    const subject=typeof b.subject==="string"?b.subject.trim():undefined;
    const textBody=typeof b.textBody==="string"?b.textBody:undefined;
    if(subject!==undefined&&subject.length>200)return new NextResponse("Onderwerp te lang.",{status:422});
    if(textBody!==undefined&&textBody.length>100000)return new NextResponse("Bericht te lang.",{status:422});
    const updated=await db.mailMessage.update({where:{id:draft.id},data:{...(to!==undefined?{toEmails:to}:{}),...(subject!==undefined?{subject}:{}),...(textBody!==undefined?{textBody}: {})}});
    await db.auditLog.create({data:{userId:u.id,action:"MAIL_DRAFT_UPDATED",metadata:{messageId:id}}});
    return NextResponse.json(updated);
  }catch(e:any){return new NextResponse(e?.message||"Concept bijwerken mislukt.",{status:400})}
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const u=await requireUser();const{id}=await params;const draft=await ownedDraft(u.id,id);
    if(!draft)return new NextResponse("Concept niet gevonden.",{status:404});
    await db.mailMessage.delete({where:{id:draft.id}});
    await db.auditLog.create({data:{userId:u.id,action:"MAIL_DRAFT_DELETED",metadata:{messageId:id}}});
    return new NextResponse(null,{status:204});
  }catch(e:any){return new NextResponse(e?.message||"Concept verwijderen mislukt.",{status:400})}
}
