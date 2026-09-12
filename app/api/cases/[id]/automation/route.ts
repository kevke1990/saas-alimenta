import {NextResponse} from "next/server";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {suggestWorkflowTasks,buildEmailDraft} from "@/lib/workflow-automation";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const u=await requireUser();const{id}=await params;
    const c=await db.case.findFirst({where:{id,userId:u.id},include:{client:true,calculations:{orderBy:{createdAt:"desc"},take:1}}});
    if(!c)return new NextResponse("Dossier niet gevonden.",{status:404});
    const now=new Date();const start=new Date(now);start.setHours(0,0,0,0);const end=new Date(now);end.setHours(23,59,59,999);
    const[docs,facts,overdue,today,existing]=await Promise.all([
      db.document.count({where:{userId:u.id,caseId:id,approvedAt:null,aiStatus:{not:"NOT_ANALYZED"}}}),
      db.incomeFact.count({where:{userId:u.id,caseId:id,status:"PROPOSED"}}),
      db.task.count({where:{userId:u.id,caseId:id,status:"OPEN",dueAt:{lt:now}}}),
      db.task.count({where:{userId:u.id,caseId:id,status:"OPEN",dueAt:{gte:start,lte:end}}}),
      db.task.findMany({where:{userId:u.id,caseId:id,status:"OPEN"},select:{title:true}})
    ]);
    const titles=new Set(existing.map(t=>t.title));
    const suggestions=suggestWorkflowTasks({reviewStatus:c.reviewStatus,hasCalculation:c.calculations.length>0,proposedIncomeFacts:facts,documentsAwaitingReview:docs,overdueTasks:overdue,todayTasks:today}).filter(s=>!titles.has(s.title));
    return NextResponse.json({suggestions});
  }catch(e:any){return new NextResponse(e?.message||"Automatisering mislukt.",{status:400})}
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const u=await requireUser();const{id}=await params;
    const c=await db.case.findFirst({where:{id,userId:u.id},include:{client:true}});
    if(!c)return new NextResponse("Dossier niet gevonden.",{status:404});
    const body=await req.json();const action=String(body.action||"");
    if(action==="task"){
      const title=String(body.title||"").trim();const description=String(body.description||"").trim();const dueDays=Math.max(0,Math.min(365,Number(body.dueDays)||0));
      if(!title||title.length>200)return new NextResponse("Ongeldige taak.",{status:422});
      const priority=body.priority==="URGENT"?"URGENT":body.priority==="HIGH"?"HIGH":"NORMAL";
      const duplicate=await db.task.findFirst({where:{userId:u.id,caseId:id,status:"OPEN",title}});if(duplicate)return NextResponse.json(duplicate,{status:200});
      const task=await db.task.create({data:{userId:u.id,caseId:id,title,description:description||null,priority,dueAt:new Date(Date.now()+dueDays*86400000)}});
      await db.auditLog.create({data:{userId:u.id,action:"AUTOMATION_TASK_ACCEPTED",metadata:{caseId:id,taskId:task.id,title,priority}}});return NextResponse.json(task);
    }
    if(action==="calendar"){
      const title=String(body.title||`Opvolging ${c.name}`).trim();const start=new Date(String(body.startAt||""));const duration=Math.max(15,Math.min(480,Number(body.durationMins)||30));
      if(Number.isNaN(start.getTime()))return new NextResponse("Ongeldige starttijd.",{status:422});
      const reminderRaw=Number(body.reminderMins);const reminder=Number.isFinite(reminderRaw)?Math.max(0,Math.min(1440,reminderRaw)):30;
      const end=new Date(start.getTime()+duration*60000);
      const duplicate=await db.calendarEvent.findFirst({where:{userId:u.id,clientId:c.clientId,title,startAt:start,endAt:end}});
      if(duplicate)return NextResponse.json({...duplicate,duplicate:true},{status:200});
      const event=await db.calendarEvent.create({data:{userId:u.id,clientId:c.clientId,title,description:String(body.description||`Opvolging dossier ${c.name}`),startAt:start,endAt:end,attendeeEmail:c.client?.email||null,attendeeName:c.client?.name||null,reminderMins:reminder}});
      await db.auditLog.create({data:{userId:u.id,action:"AUTOMATION_CALENDAR_CREATED",metadata:{caseId:id,eventId:event.id}}});return NextResponse.json(event);
    }
    if(action==="email-draft"){
      const draft=buildEmailDraft(c.name,c.client?.name||"cliënt",String(body.nextStep||"de volgende stap te bespreken"));
      const requestedTo=Array.isArray(body.to)?body.to.map((value:unknown)=>String(value).trim()).filter(Boolean):[];
      const to=requestedTo.length?requestedTo:(c.client?.email?[c.client.email]:[]);
      const identity=await db.mailIdentity.findFirst({where:{userId:u.id},orderBy:{createdAt:"asc"}});
      const message=await db.mailMessage.create({data:{userId:u.id,clientId:c.clientId,caseId:id,direction:"OUTBOUND",fromEmail:identity?.fromEmail||u.email,toEmails:to,subject:draft.subject,textBody:draft.body,status:"DRAFT"}});
      await db.auditLog.create({data:{userId:u.id,action:"AUTOMATION_EMAIL_DRAFT_CREATED",metadata:{caseId:id,messageId:message.id,subject:draft.subject,toCount:to.length}}});
      return NextResponse.json({id:message.id,to,subject:draft.subject,body:draft.body,status:"DRAFT"});
    }
    return new NextResponse("Onbekende automation actie.",{status:422});
  }catch(e:any){return new NextResponse(e?.message||"Automatiseringsactie mislukt.",{status:400})}
}
