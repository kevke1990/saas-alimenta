import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getMetrics } from "@/lib/performance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ service: "alimenta-pro", ...getMetrics() });
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
}
