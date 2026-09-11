import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolvePortalShare } from "@/lib/client-portal-share";

type PortalTransfer = {
  childIndex: number;
  direction: string;
  payment: number;
  careDiscount: number;
  note?: string;
};

function serializePortalCalculation(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const source = result as Record<string, unknown>;
  const transfers = Array.isArray(source.transfers)
    ? source.transfers
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item): PortalTransfer => ({
          childIndex: Number(item.childIndex) || 0,
          direction: typeof item.direction === "string" ? item.direction : "",
          payment: Number(item.payment) || 0,
          careDiscount: Number(item.careDiscount) || 0,
          note: typeof item.note === "string" ? item.note : undefined,
        }))
    : [];

  return {
    totalNeed: Number(source.totalNeed) || 0,
    capacitySufficient: Boolean(source.capacitySufficient),
    transfers,
    warnings: Array.isArray(source.warnings)
      ? source.warnings.filter((warning): warning is string => typeof warning === "string")
      : [],
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const share = await resolvePortalShare(token);
    const caseRow = await db.case.findUnique({ where: { id: share.caseId }, select: {
      id: true, name: true, status: true, reviewStatus: true, updatedAt: true,
      client: { select: { name: true } },
      calculations: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, engineVersion: true, normVersion: true, result: true, createdAt: true } },
      documents: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, name: true, category: true, mimeType: true, sizeBytes: true, createdAt: true } },
    }});
    if (!caseRow) return new NextResponse("Dossier niet gevonden.", { status: 404 });

    const calculations = caseRow.calculations.map(calculation => ({
      id: calculation.id,
      engineVersion: calculation.engineVersion,
      normVersion: calculation.normVersion,
      createdAt: calculation.createdAt,
      result: serializePortalCalculation(calculation.result),
    }));

    return NextResponse.json({
      shareId: share.shareId,
      expiresAt: share.expiresAt,
      case: { ...caseRow, calculations },
    });
  } catch {
    return new NextResponse("Ongeldige of verlopen cliëntportal-link.", { status: 401 });
  }
}
