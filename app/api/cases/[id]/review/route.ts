import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewCase } from "@/lib/case-review";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const c = await db.case.findFirst({
      where: { id, userId: u.id },
      include: { documents: { select: { aiStatus: true, approvedAt: true } }, calculations: { orderBy: { createdAt: "desc" } } },
    });
    if (!c) return new NextResponse("Dossier niet gevonden", { status: 404 });
    return NextResponse.json(reviewCase({ data: c.data, documents: c.documents, calculations: c.calculations, result: c.result }));
  } catch (e: any) {
    return new NextResponse(e?.message || "Case Review mislukt", { status: 400 });
  }
}
