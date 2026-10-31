import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { calculateTrema2027, type Trema2027Input } from "@/lib/alimentatie-engine-trema-2027";
import { trema2027PayloadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const parseResult = trema2027PayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "Ongeldige invoerparameters voor 2027 rekenkader.", details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const input = parseResult.data as Trema2027Input;
    const result = calculateTrema2027(input);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onbekende fout bij de berekening.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
