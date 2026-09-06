import { db } from "./db";

export async function sendTransactionalEmail(input:{from:string;to:string[];cc?:string[];subject:string;textBody?:string;htmlBody?:string;replyTo?:string;attachments?:{Name:string;Content:string;ContentType:string;ContentID?:string}[];metadata?:Record<string,string>}){
 const token=process.env.POSTMARK_SERVER_TOKEN; if(!token) throw new Error("POSTMARK_SERVER_TOKEN ontbreekt");
 const body:any={From:input.from,To:input.to.join(","),Subject:input.subject,TextBody:input.textBody||"",HtmlBody:input.htmlBody||undefined,ReplyTo:input.replyTo||undefined,MessageStream:process.env.POSTMARK_OUTBOUND_STREAM||"outbound",Attachments:input.attachments||undefined,Metadata:input.metadata||undefined};
 const r=await fetch("https://api.postmarkapp.com/email",{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json","X-Postmark-Server-Token":token},body:JSON.stringify(body)});
 const j:any=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j?.Message||`Postmark fout (${r.status})`); return j;
}

export async function getMailIdentity(userId:string){return db.mailIdentity.findFirst({where:{userId,status:"VERIFIED"},orderBy:{createdAt:"asc"}})}
