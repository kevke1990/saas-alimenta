import { NextResponse } from "next/server";
import { PRODUCT_VERSION, RELEASE_NAME } from "@/lib/release";

export async function GET() {
  return NextResponse.json({
    service: "alimenta-pro",
    version: PRODUCT_VERSION,
    release: RELEASE_NAME,
    environment: process.env.NODE_ENV || "unknown",
    commit: process.env.GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null,
  });
}
