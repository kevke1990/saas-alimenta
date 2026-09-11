import { getCase, deleteCase, patchCase } from "@/lib/case-route-v2";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return getCase(_, params);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return deleteCase(_, params);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return patchCase(req, params);
}
