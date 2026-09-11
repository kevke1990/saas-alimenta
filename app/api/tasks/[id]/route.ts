import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_STATUSES = new Set(["OPEN", "COMPLETED", "CANCELLED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status || "").toUpperCase();

    if (!ALLOWED_STATUSES.has(status)) {
      return new NextResponse("Ongeldige taakstatus.", { status: 422 });
    }

    const task = await db.task.findFirst({ where: { id, userId: user.id } });
    if (!task) return new NextResponse("Taak niet gevonden.", { status: 404 });

    const updated = await db.task.update({ where: { id: task.id }, data: { status } });
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "TASK_STATUS_CHANGED",
        metadata: { taskId: task.id, caseId: task.caseId, from: task.status, to: status },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : "Taak bijwerken mislukt.", { status: 400 });
  }
}
