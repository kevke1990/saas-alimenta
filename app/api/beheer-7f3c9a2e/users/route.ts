import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET() {
  await requireAdmin();
  const users = await db.user.findMany({select:{id:true,email:true,name:true,companyName:true,plan:true,createdAt:true,lastLoginAt:true,lockedAt:true},orderBy:{createdAt:"desc"}});
  return NextResponse.json(users);
}
