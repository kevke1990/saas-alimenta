import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireClientTenantAccess } from "@/lib/tenant-access";

export async function POST(req: Request,{params}:{params:Promise<{id:string}>}){
 try{
  const u=await requireUser();
  const {id}=await params;
  const body=await req.json();
  const status=body?.status==="ARCHIVED"?"ARCHIVED":"ACTIVE";
  const access=await requireClientTenantAccess(u.id,id,"PROFESSIONAL");
  const updated=await db.client.update({where:{id:access.clientId},data:{status,updatedByUserId:u.id}});
  await db.auditLog.create({data:{userId:u.id,organizationId:access.organizationId,actorRole:access.role,action:status==="ARCHIVED"?"CLIENT_ARCHIVED":"CLIENT_UNARCHIVED",metadata:{clientId:access.clientId}}});
  return NextResponse.json(updated);
 }catch(e:any){
  const status=e?.status===403?403:e?.message==="UNAUTHORIZED"?401:400;
  return new NextResponse(e?.message||"Archiveren mislukt",{status});
 }
}
