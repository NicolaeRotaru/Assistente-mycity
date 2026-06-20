import { NextRequest, NextResponse } from "next/server";
import { runCycle } from "@/lib/heartbeat";

export const runtime = "nodejs";
export const maxDuration = 120;

// Il "battito": esegue un giro autonomo. Lo chiama il cron (ogni ora) oppure
// il pulsante "Aggiorna ora" della dashboard.
// Sicurezza: se CRON_SECRET e' impostato, va passato (il cron di Vercel lo
// invia da solo come Authorization: Bearer). In test, lascialo vuoto.
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
  }
  try {
    const briefing = await runCycle();
    return NextResponse.json({ ok: true, briefing });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
