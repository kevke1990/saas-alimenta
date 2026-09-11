import {NextResponse} from "next/server";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";

export async function GET(){
  try{
    const u=await requireUser();
    const drafts=await db.mailMessage.findMany({where:{userId:u.id,direction:"OUTBOUND",status:"DRAFT"},include:{client:true,case:true},orderBy:{createdAt:"desc"},take:50});
    return NextResponse.json(drafts);
  }catch(e:any){return new NextResponse(e?.message||"Concepten ophalen mislukt.",{status:400})}
}
