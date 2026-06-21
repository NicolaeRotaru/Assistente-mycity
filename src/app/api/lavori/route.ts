import { NextRequest, NextResponse } from "next/server";
import { creaLavoro, getLavori, clearLavori, memoryConnected } from "@/lib/store";

export const runtime = "nodejs";

// Il "ponte" tra l'app web e il cervello (Claude Code sul Max).
// GET: elenco lavori (la dashboard fa polling per mostrare i risultati).
export async function GET() {
  try {
    const lavori = await getLavori(50);
    return NextResponse.json({ memoria: memoryConnected(), lavori });
  } catch (e: any) {
    return NextResponse.json({ memoria: false, lavori: [], error: e.message });
  }
}

// POST: crea un lavoro da far eseguire al cervello.
export async function POST(req: NextRequest) {
  try {
    const { richiesta, tipo } = await req.json();
    const t = String(richiesta || "").trim();
    if (!t) return NextResponse.json({ ok: false, error: "Richiesta vuota." }, { status: 400 });
    const lavoro = await creaLavoro(t, tipo ? String(tipo) : undefined);
    if (!lavoro) {
      return NextResponse.json(
        { ok: false, error: "Database non collegato o tabella 'lavori' mancante." },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, lavoro });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// DELETE: svuota i lavori.
export async function DELETE() {
  try {
    await clearLavori();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
