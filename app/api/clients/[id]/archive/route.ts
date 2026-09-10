import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request,{params}:{params:Promise<{id:string}>}){
 try{
  const u=await requireUser(); const {id}=await params; const body=await req.json(); const status=body?.status==="ARCHIVED"?"ARCHIVED":"ACTIVE";
  const c=await db.client.findFirst({where:{id,userId:u.id}}); if(!c)return new NextResponse("Cliënt niet gevonden",{status:404});
  const updated=await db.client.update({where:{id},data:{status}});
  await db.auditLog.create({data:{userId:u.id,action:status==="ARCHIVED"?"CLIENT_ARCHIVED":"CLIENT_UNARCHIVED",metadata:{clientId:id}}});
  return NextResponse.json(updated);
 }catch(e:any){return new NextResponse(e?.message||"Archiveren mislukt",{status:400});}
}
