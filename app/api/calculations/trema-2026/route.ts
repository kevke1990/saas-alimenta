import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { adaptAlimentaForm, type AlimentaFormPayload } from "@/lib/alimentatie-engine-adapter";
import { calculateTrema2026 } from "@/lib/alimentatie-engine-trema-2026";
import { alimentaFormPayloadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const parseResult = alimentaFormPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "Ongeldige invoerparameters.", details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const payload = parseResult.data as AlimentaFormPayload;
    const input = adaptAlimentaForm(payload);
    const result = calculateTrema2026(input);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onbekende fout bij de berekening.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
