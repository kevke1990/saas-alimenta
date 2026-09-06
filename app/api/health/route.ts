import { PRODUCT_VERSION } from "@/lib/release";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET(){
  try { await db.$queryRaw`SELECT 1`; return NextResponse.json({ok:true,service:"alimenta-pro",version:PRODUCT_VERSION}); }
  catch { return NextResponse.json({ok:false},{status:503}); }
}
