import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptDocument } from "@/lib/document-store";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){try{const u=await requireUser();const {id}=await params;const d=await db.document.findFirst({where:{id,userId:u.id}});if(!d)return new NextResponse("Document niet gevonden",{status:404});return new Response(decryptDocument(d.storageCipher),{headers:{"content-type":d.mimeType,"content-disposition":`inline; filename="${d.name.replace(/"/g,"")}"`,"cache-control":"private, no-store"}})}catch(e:any){return new NextResponse(e?.message||"Document mislukt",{status:400})}}
