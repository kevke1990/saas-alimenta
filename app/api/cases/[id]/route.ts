import { requireUser } from "@/lib/auth";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { getCase, deleteCase, patchCase } from "@/lib/case-route-v2";

async function authorizeCase(userId: string, params: Promise<{ id: string }>, minimumRole: "READ_ONLY" | "PROFESSIONAL") {
  const { id } = await params;
  return requireCaseTenantAccess(userId, id, minimumRole);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  await authorizeCase(user.id, params, "READ_ONLY");
  return getCase(request, params);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  await authorizeCase(user.id, params, "PROFESSIONAL");
  return deleteCase(request, params);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  await authorizeCase(user.id, params, "PROFESSIONAL");
  return patchCase(request, params);
}
