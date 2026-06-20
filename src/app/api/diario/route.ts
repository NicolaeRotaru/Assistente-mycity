import { NextRequest, NextResponse } from "next/server";
import { saveDiarioVoce, getDiario, clearDiario, memoryConnected } from "@/lib/store";

export const runtime = "nodejs";

// GET: tutte le voci salvate (lato server, durevoli).
export async function GET() {
  return NextResponse.json({ memoria: memoryConnected(), voci: await getDiario() });
}

// POST: salva una voce { tipo, titolo, testo }.
export async function POST(req: NextRequest) {
  try {
    const { tipo, titolo, testo } = await req.json();
    if (!tipo || !titolo) return NextResponse.json({ ok: false }, { status: 400 });
    await saveDiarioVoce({ tipo: String(tipo), titolo: String(titolo), testo: String(testo ?? "") });
    return NextResponse.json({ ok: true, memoria: memoryConnected() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// DELETE: svuota il diario.
export async function DELETE() {
  try {
    await clearDiario();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
