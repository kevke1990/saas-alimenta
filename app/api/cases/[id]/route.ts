import { requireUser } from "@/lib/auth";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { getCase, deleteCase, patchCase } from "@/lib/case-route-v2";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  await requireCaseTenantAccess(user.id, id, "READ_ONLY");
  return getCase(request, Promise.resolve({ id }));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  await requireCaseTenantAccess(user.id, id, "PROFESSIONAL");
  return deleteCase(request, Promise.resolve({ id }));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  await requireCaseTenantAccess(user.id, id, "PROFESSIONAL");
  return patchCase(request, Promise.resolve({ id }));
}
