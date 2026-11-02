import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      select: { id: true, email: true, name: true, companyName: true, plan: true, createdAt: true, lastLoginAt: true, lockedAt: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    });
    return NextResponse.json(users);
  } catch (e: any) {
    return new NextResponse(e?.message || "Forbidden", { status: 403 });
  }
}
