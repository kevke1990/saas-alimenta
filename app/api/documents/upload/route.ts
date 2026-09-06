import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptDocument, MAX_DOCUMENT_BYTES, safeDocumentName, sha256 } from "@/lib/document-store";

const allowed=new Set(["application/pdf","image/jpeg","image/png","image/webp"]);
export async function POST(req:Request){
 try{const u=await requireUser();const form=await req.formData();const file=form.get("file");const clientId=String(form.get("clientId")||"")||null;const caseId=String(form.get("caseId")||"")||null;
  if(!(file instanceof File)) return new NextResponse("Bestand ontbreekt",{status:422}); if(file.size>MAX_DOCUMENT_BYTES)return new NextResponse("Bestand is groter dan 15 MB",{status:413}); if(!allowed.has(file.type))return new NextResponse("Alleen PDF, JPG, PNG of WEBP wordt ondersteund",{status:415});
  if(clientId && !(await db.client.findFirst({where:{id:clientId,userId:u.id}})))return new NextResponse("Cliënt niet gevonden",{status:404});
  if(caseId && !(await db.case.findFirst({where:{id:caseId,userId:u.id}})))return new NextResponse("Dossier niet gevonden",{status:404});
  const buf=Buffer.from(await file.arrayBuffer());const d=await db.document.create({data:{userId:u.id,clientId,caseId,name:safeDocumentName(file.name),mimeType:file.type,sizeBytes:buf.length,sha256:sha256(buf),source:"SCAN_OR_UPLOAD",storageCipher:encryptDocument(buf)}});
  await db.auditLog.create({data:{userId:u.id,action:"DOCUMENT_UPLOADED",metadata:{documentId:d.id,clientId,caseId,mimeType:file.type,sizeBytes:buf.length}}});
  return NextResponse.json({id:d.id,name:d.name,sizeBytes:d.sizeBytes,mimeType:d.mimeType,aiStatus:d.aiStatus});
 }catch(e:any){return new NextResponse(e?.message||"Upload mislukt",{status:400})}
}
