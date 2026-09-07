import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getReadiness();
  return NextResponse.json(result, { status: result.ready ? 200 : 503 });
}
