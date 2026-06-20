import { NextRequest, NextResponse } from "next/server";
import { eseguiAzione } from "@/lib/azioni";

export const runtime = "nodejs";

// Esegue un'azione approvata dal proprietario (via n8n). Chiamato dal pulsante
// "Approva" della dashboard: il click dell'utente E' la conferma.
export async function POST(req: NextRequest) {
  try {
    const { azione } = await req.json();
    const res = await eseguiAzione(azione || {});
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ collegato: false, ok: false, risultato: e.message }, { status: 500 });
  }
}
