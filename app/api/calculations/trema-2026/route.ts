import { NextResponse } from "next/server";
import { adaptAlimentaForm, type AlimentaFormPayload } from "@/lib/alimentatie-engine-adapter";
import { calculateTrema2026 } from "@/lib/alimentatie-engine-trema-2026";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AlimentaFormPayload;
    const input = adaptAlimentaForm(payload);
    const result = calculateTrema2026(input);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onbekende fout bij de berekening.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
