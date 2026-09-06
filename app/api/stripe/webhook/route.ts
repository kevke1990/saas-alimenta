import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripeClient, getWebhookSecret } from "@/lib/stripe";

function planFromPrice(priceId:string){return db.stripePlan.findFirst({where:{stripePriceId:priceId}})}
async function syncSubscription(s:Stripe.Subscription){
  const customer=String(s.customer); const u=await db.user.findFirst({where:{stripeCustomerId:customer}}); if(!u)return;
  const item=s.items.data[0]; const priceId=String(item?.price?.id||""); const plan=await planFromPrice(priceId);
  const status=s.status as any;
  const mapped=status==="trialing"?"TRIALING":status==="active"?"ACTIVE":status==="past_due"?"PAST_DUE":status==="canceled"?"CANCELED":"INCOMPLETE";
  await db.user.update({where:{id:u.id},data:{plan:status==="canceled"||status==="incomplete_expired"?"FREE":plan?.key==="enterprise"?"ENTERPRISE":plan?.key?.startsWith("practice")?"PRACTICE":plan?.key==="pro"?"PRO":"FREE",stripeSubscriptionId:s.id,subscriptionStatus:mapped,subscriptionEndsAt:new Date((s as any).current_period_end*1000)}});
  await db.subscription.upsert({where:{userId:u.id},update:{stripeSubscriptionId:s.id,stripePriceId:priceId,status:mapped,currentPeriodEnd:new Date((s as any).current_period_end*1000)},create:{userId:u.id,stripeSubscriptionId:s.id,stripePriceId:priceId,status:mapped,currentPeriodEnd:new Date((s as any).current_period_end*1000)}});
}
export async function POST(req:Request){
  const body=await req.text(); const sig=req.headers.get("stripe-signature"); if(!sig)return new NextResponse("Missing signature",{status:400});
  try{const stripe=await getStripeClient(); const secret=await getWebhookSecret(); if(!secret)return new NextResponse("Webhook secret ontbreekt",{status:500}); const event=stripe.webhooks.constructEvent(body,sig,secret);
    if(await db.stripeEvent.findUnique({where:{eventId:event.id}}))return NextResponse.json({received:true,duplicate:true});
    switch(event.type){
      case "checkout.session.completed": {const s=event.data.object as Stripe.Checkout.Session; if(s.subscription){const sub=await stripe.subscriptions.retrieve(String(s.subscription)); await syncSubscription(sub);} break;}
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": await syncSubscription(event.data.object as Stripe.Subscription); break;
      case "invoice.payment_failed": {const inv=event.data.object as Stripe.Invoice; const u=await db.user.findFirst({where:{stripeCustomerId:String(inv.customer)}}); if(u)await db.user.update({where:{id:u.id},data:{subscriptionStatus:"PAST_DUE"}}); break;}
    }
    await db.stripeEvent.create({data:{eventId:event.id,type:event.type}});
    return NextResponse.json({received:true});
  }catch(e:any){return new NextResponse(e?.message||"Invalid webhook",{status:400});}
}
