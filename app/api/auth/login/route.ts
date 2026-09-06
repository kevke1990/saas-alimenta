import { NextResponse } from "next/server";
import { distributedRateLimit, requestKey } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { decryptSecret, verifyTotp } from "@/lib/totp";
export async function POST(req:Request){
  const rl=await distributedRateLimit(requestKey(req,"login"),10,15*60*1000);
  if(!rl.ok)return new NextResponse("Te veel inlogpogingen. Probeer later opnieuw.",{status:429,headers:{"Retry-After":String(rl.retryAfter)}});
  try{
    const {email,password,code}=await req.json();
    const u=await db.user.findUnique({where:{email:String(email).toLowerCase()}});
    if(!u||!(await verifyPassword(String(password),u.passwordHash)))return new NextResponse("Ongeldige inloggegevens",{status:401});
    if(u.lockedAt)return new NextResponse("Account geblokkeerd",{status:423});
    if(u.mfaEnabled){if(!u.mfaSecretCipher||!code||!verifyTotp(decryptSecret(u.mfaSecretCipher),String(code)))return new NextResponse("MFA-code vereist of ongeldig",{status:401});}
    await createSession(u.id);await db.user.update({where:{id:u.id},data:{lastLoginAt:new Date()}});return NextResponse.json({ok:true,mfa:u.mfaEnabled});
  }catch{return new NextResponse("Ongeldige invoer",{status:400})}
}
