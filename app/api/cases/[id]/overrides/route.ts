import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { professionalAdjustmentFingerprint, validateOverride } from '@/lib/professional-override';
import { isCaseLockedForCalculation } from '@/lib/case-lock';

const ALLOWED_RESULT_FIELDS = new Set(['combined.childSupportTotal','combined.childSupportByParent.0','combined.childSupportByParent.1','combined.partnerSupport.monthlyNet','combined.partnerSupport.monthlyGross','combined.totalMonthlyPayments','partnerSupport.result.monthlyNet','partnerSupport.result.monthlyGross']);
function readPath(root:any,path:string){return path.split('.').reduce((value,key)=>value==null?undefined:value[key],root);}
function writePath(root:any,path:string,value:unknown){const keys=path.split('.');const next=structuredClone(root??{});let cursor=next;for(let i=0;i<keys.length-1;i++){const key=keys[i];if(cursor[key]==null)cursor[key]=/^\d+$/.test(keys[i+1])?[]:{};cursor=cursor[key];}cursor[keys[keys.length-1]]=value;return next;}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const user=await requireUser();const{id}=await params;const c=await db.case.findFirst({where:{id,userId:user.id}});if(!c)return new NextResponse('Dossier niet gevonden.',{status:404});return NextResponse.json(await db.professionalOverride.findMany({where:{caseId:id,userId:user.id},orderBy:{createdAt:'desc'}}));}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const user=await requireUser();const{id}=await params;const isJson=req.headers.get('content-type')?.includes('application/json');
  const c=await db.case.findFirst({where:{id,userId:user.id,status:{not:'ARCHIVED'}},include:{calculations:{orderBy:{createdAt:'desc'},take:1}}});
  if(!c)return new NextResponse('Dossier niet gevonden.',{status:404});
  if(isCaseLockedForCalculation(c.reviewStatus))return new NextResponse('Dit dossier is vergrendeld. Heropen eerst de review.',{status:409});
  const b:any=isJson?await req.json():Object.fromEntries((await req.formData()).entries());
  if(b.overrideValue!==undefined){const raw=String(b.overrideValue);b.overrideValue=raw!==''&&!Number.isNaN(Number(raw))?Number(raw):raw;}
  const v=validateOverride({field:b.field,originalValue:b.originalValue,overrideValue:b.overrideValue,reason:b.reason});
  if(!ALLOWED_RESULT_FIELDS.has(v.field))return new NextResponse('Dit resultaatonderdeel kan niet rechtstreeks worden aangepast. Kies een toegestaan professioneel resultaatveld.',{status:422});
  const current=c.calculations[0];if(!current)return new NextResponse('Er is nog geen berekeningssnapshot beschikbaar.',{status:409});
  const originalValue=readPath(current.result,v.field);const adjustedResult=writePath(current.result,v.field,v.overrideValue);const fingerprint=professionalAdjustmentFingerprint(String((current.result as any)?.calculationFingerprint||''),{...v,originalValue});
  const finalResult={...adjustedResult,calculationFingerprint:fingerprint,calculationKind:'PROFESSIONAL_ADJUSTED',professionalAdjustment:{field:v.field,originalValue,overrideValue:v.overrideValue,reason:v.reason,basedOnCalculationId:current.id}};
  const updated=await db.$transaction(async tx=>{const created=await tx.professionalOverride.create({data:{caseId:id,userId:user.id,field:v.field,originalValue:originalValue as any,overrideValue:v.overrideValue as any,reason:v.reason}});const calculation=await tx.calculation.create({data:{caseId:id,engineVersion:current.engineVersion,normVersion:current.normVersion,inputSnapshot:current.inputSnapshot,result:finalResult as any}});const nextCase=await tx.case.update({where:{id},data:{result:finalResult as any,status:'CALCULATED',reviewStatus:'INCOMPLETE',reviewedAt:null,approvedAt:null,approvedByUserId:null}});await tx.auditLog.create({data:{userId:user.id,action:'PROFESSIONAL_OVERRIDE_CREATED',metadata:{caseId:id,overrideId:created.id,field:v.field,calculationId:calculation.id,previousCalculationId:current.id,originalValue,overrideValue:v.overrideValue,reason:v.reason,fingerprint}}});await tx.auditLog.create({data:{userId:user.id,action:'CASE_RECALCULATED_WITH_OVERRIDE',metadata:{caseId:id,calculationId:calculation.id,previousCalculationId:current.id,fingerprint,reviewReset:true}}});return{nextCase,calculation,created};});
  if(!isJson)return NextResponse.redirect(new URL(`/cases/${id}/review`,req.url),303);
  return NextResponse.json({...updated.created,calculationId:updated.calculation.id,recalculated:true},{status:201});
 }catch(e:any){return new NextResponse(e?.message||'Override opslaan mislukt.',{status:422});}
}
