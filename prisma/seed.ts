import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";
const db=new PrismaClient();
const plans=[{key:"private",name:"Particulier",annualAmountCents:1995},{key:"pro",name:"Zakelijk",annualAmountCents:24900}];
async function main(){const email=(process.env.ADMIN_EMAIL||"admin@example.nl").toLowerCase();const password=process.env.ADMIN_PASSWORD||"CHANGE-ME";const exists=await db.user.findUnique({where:{email}});if(!exists)await db.user.create({data:{email,passwordHash:await bcrypt.hash(password,12),name:"Admin",plan:"PRO",isAdmin:true,role:"ADMIN",accountType:"BUSINESS"}});else if(!exists.isAdmin)await db.user.update({where:{id:exists.id},data:{isAdmin:true,role:"ADMIN",plan:"PRO",accountType:"BUSINESS"}});for(const p of plans)await db.stripePlan.upsert({where:{key:p.key},update:{name:p.name,annualAmountCents:p.annualAmountCents},create:p});await db.normVersion.upsert({where:{version:"2026.1"},update:{isActive:true},create:{version:"2026.1",year:2026,effectiveFrom:new Date("2026-01-01"),source:"Rechtspraak Expertgroep Alimentatienormen / bijlagen 2026",data:{needsTable:"2026",capacityTable:"2026"},isActive:true}})}
main().finally(()=>db.$disconnect());
