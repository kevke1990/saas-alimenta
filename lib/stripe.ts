import Stripe from "stripe";
import { db } from "./db";
import { decryptSecret } from "./secrets";

export async function getStripeConfig(){ return db.stripeConfig.findFirst(); }
export async function getStripeClient(){
  const cfg=await getStripeConfig();
  const key=cfg?.secretKeyCipher ? decryptSecret(cfg.secretKeyCipher) : process.env.STRIPE_SECRET_KEY;
  if(!key) throw new Error("Stripe is nog geconfigureerd");
  return new Stripe(key);
}
export async function getWebhookSecret(){
  const cfg=await getStripeConfig();
  if(cfg?.webhookSecretCipher) return decryptSecret(cfg.webhookSecretCipher);
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}
