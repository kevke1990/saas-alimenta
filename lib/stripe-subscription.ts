import type Stripe from "stripe";
export type AppPlan="FREE"|"PRIVATE"|"PRO"|"PRACTICE"|"ENTERPRISE";
export type AppSubscriptionStatus="TRIALING"|"ACTIVE"|"PAST_DUE"|"CANCELED"|"INCOMPLETE";
export function mapPlanKey(planKey?:string|null):AppPlan{if(planKey==="private")return "PRIVATE";if(planKey==="pro")return "PRO";if(planKey?.startsWith("practice"))return "PRACTICE";if(planKey==="enterprise")return "ENTERPRISE";return "FREE";}
export function mapStripeStatus(status:Stripe.Subscription.Status):AppSubscriptionStatus{if(status==="trialing")return "TRIALING";if(status==="active")return "ACTIVE";if(status==="past_due")return "PAST_DUE";if(status==="canceled")return "CANCELED";return "INCOMPLETE";}
export function planForSubscription(status:Stripe.Subscription.Status,planKey?:string|null):AppPlan{return status==="canceled"||status==="incomplete_expired"?"FREE":mapPlanKey(planKey);}
export function periodEnd(value:number|null|undefined):Date|null{return value&&value>0?new Date(value*1000):null;}
