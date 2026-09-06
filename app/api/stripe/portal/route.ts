import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
export async function POST(){try{const u=await requireUser();if(!u.stripeCustomerId)return new NextResponse("Geen Stripe-klant gevonden",{status:400});const stripe=await getStripeClient();const s=await stripe.billingPortal.sessions.create({customer:u.stripeCustomerId,return_url:`${process.env.APP_URL}/billing`});return NextResponse.redirect(s.url,303)}catch(e:any){return new NextResponse(e?.message||"Portal mislukt",{status:500})}}
