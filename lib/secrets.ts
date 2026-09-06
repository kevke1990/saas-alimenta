import crypto from "crypto";

function key(){
  const raw=process.env.APP_ENCRYPTION_KEY || process.env.MAIL_ENCRYPTION_KEY;
  if(!raw) throw new Error("APP_ENCRYPTION_KEY ontbreekt");
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(value:string){
  const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv("aes-256-gcm",key(),iv);
  const enc=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
  return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),enc.toString("base64url")].join(".");
}
export function decryptSecret(value:string){
  const [iv,tag,data]=value.split("."); if(!iv||!tag||!data) throw new Error("Ongeldige secret");
  const decipher=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"base64url"));
  decipher.setAuthTag(Buffer.from(tag,"base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8");
}
