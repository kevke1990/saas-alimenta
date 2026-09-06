import crypto from "crypto";
import { encryptSecret, decryptSecret } from "./secrets";
export const MAX_DOCUMENT_BYTES=15*1024*1024;
export function encryptDocument(buf:Buffer){return encryptSecret(buf.toString("base64"));}
export function decryptDocument(value:string){return Buffer.from(decryptSecret(value),"base64");}
export function sha256(buf:Buffer){return crypto.createHash("sha256").update(buf).digest("hex");}
export function safeDocumentName(name:string){return name.replace(/[^a-zA-Z0-9._ -]/g,"_").slice(0,180)||"document";}
