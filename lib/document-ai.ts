import crypto from "crypto";

export const AI_ANALYSIS_VERSION = "2.0";

const schema = {
  type: "object",
  properties: {
    documentType: { type: "string", enum: ["PAYSLIP","ANNUAL_STATEMENT","BENEFIT_STATEMENT","EMPLOYMENT_CONTRACT","BANK_STATEMENT","TAX_DOCUMENT","OTHER","UNKNOWN"] },
    personName: { type: ["string","null"] },
    employer: { type: ["string","null"] },
    period: { type: ["string","null"] },
    fields: { type: "array", items: { type: "object", properties: {
      key: { type: "string" }, label: { type: "string" }, valueNumber: { type: ["number","null"] }, valueText: { type: ["string","null"] }, unit: { type: ["string","null"] }, confidence: { type: "number", minimum: 0, maximum: 1 }, page: { type: ["integer","null"] }, sourceHint: { type: ["string","null"] }
    }, required: ["key","label","valueNumber","valueText","unit","confidence","page","sourceHint"] } },
    anomalies: { type: "array", items: { type: "object", properties: { severity:{type:"string",enum:["INFO","WARNING","HIGH"]}, message:{type:"string"} }, required:["severity","message"] } },
    warnings: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["documentType","personName","employer","period","fields","anomalies","warnings","confidence"]
};

export function analysisHash(data: Buffer) { return crypto.createHash("sha256").update(data).digest("hex"); }

export async function analyzeDocumentBytes(input:{data:Buffer;mimeType:string;name:string}) {
  const key=process.env.GOOGLE_AI_API_KEY;
  if(!key) throw new Error("GOOGLE_AI_API_KEY ontbreekt");
  if(process.env.AI_PROCESSING_DISABLED==="true") throw new Error("AI-documentanalyse is uitgeschakeld");
  const model=process.env.GOOGLE_AI_MODEL||"gemini-3.8-flash";
  const prompt=`Je bent Alimenta Pro Document Intelligence. Extraheer uitsluitend aantoonbare gegevens uit dit document. Verzin niets. Dit is géén juridisch, fiscaal of alimentatieadvies. Gebruik null als een waarde niet betrouwbaar kan worden vastgesteld. Geef per geldbedrag de frequentie aan via unit (MONTHLY, ANNUAL, PERCENT, EUR, TEXT). Geef bij PDF zoveel mogelijk de pagina en een korte bronverwijzing. Herken salaris, vakantiegeld, IKB/PKB, 13e maand, bonus, overwerk, belaste vergoedingen, uitkeringen, pensioenpremie, andere premies, netto loon en relevante fiscale gegevens. Signaleer afwijkende of tegenstrijdige waarden. De professional moet alle voorstellen controleren.`;
  const body={model,input:[{type:"document",data:input.data.toString("base64"),mime_type:input.mimeType},{type:"text",text:prompt}],response_format:{type:"text",mime_type:"application/json",schema},store:false};
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions`,{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify(body)});
  if(!r.ok) { const t=await r.text(); throw new Error(`Gemini documentanalyse fout (${r.status}): ${t.slice(0,300)}`); }
  const j:any=await r.json();
  const text=j?.outputs?.map((o:any)=>o?.text||"").join("")||j?.output_text||"{}";
  return {result:JSON.parse(text),model,analysisVersion:AI_ANALYSIS_VERSION};
}
