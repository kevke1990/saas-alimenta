import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { getCase, deleteCase, patchCase } from "@/lib/case-route-v2";

async function authorizeCase(userId: string, params: Promise<{ id: string }>, minimumRole: "READ_ONLY" | "PROFESSIONAL") {
  const { id } = await params;
  return requireCaseTenantAccess(userId, id, minimumRole);
}

function handleError(e: any) {
  return new NextResponse(e?.message || "Toegang geweigerd", {
    status: e?.message === "UNAUTHORIZED" ? 401 : e?.status === 403 ? 403 : 404,
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const access = await authorizeCase(user.id, params, "READ_ONLY");
    return await getCase(request, params, { user, access });
  } catch (e: any) {
    return handleError(e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const access = await authorizeCase(user.id, params, "PROFESSIONAL");
    return await deleteCase(request, params, { user, access });
  } catch (e: any) {
    return handleError(e);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const access = await authorizeCase(user.id, params, "PROFESSIONAL");
    return await patchCase(request, params, { user, access });
  } catch (e: any) {
    return handleError(e);
  }
}


