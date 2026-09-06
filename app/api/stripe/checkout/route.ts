import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";

export async function POST(req:Request){
  try {
    const u=await requireUser(); const form=await req.formData(); const plan=String(form.get("plan")||"pro");
    const p=await db.stripePlan.findUnique({where:{key:plan}});
    if(!p?.active||!p.stripePriceId) return new NextResponse("Dit plan is nog niet door de beheerder aan Stripe gekoppeld",{status:400});
    const stripe=await getStripeClient();
    if(u.stripeSubscriptionId && u.subscriptionStatus && ["ACTIVE","TRIALING","PAST_DUE"].includes(u.subscriptionStatus)) return NextResponse.redirect(`${process.env.APP_URL}/billing?existing=1`,303);
    let customer=u.stripeCustomerId || undefined;
    if(!customer){ const c=await stripe.customers.create({email:u.email,name:u.name||undefined,metadata:{userId:u.id}}); customer=c.id; await db.user.update({where:{id:u.id},data:{stripeCustomerId:c.id}}); }
    const session=await stripe.checkout.sessions.create({mode:"subscription",customer,line_items:[{price:p.stripePriceId,quantity:1}],success_url:`${process.env.APP_URL}/billing?success=1`,cancel_url:`${process.env.APP_URL}/billing?canceled=1`,allow_promotion_codes:true,billing_address_collection:"required",tax_id_collection:{enabled:true},client_reference_id:u.id,metadata:{userId:u.id,plan}});
    return NextResponse.redirect(session.url!,303);
  } catch(e:any){ return new NextResponse(e?.message||"Stripe checkout mislukt",{status:500}); }
}
