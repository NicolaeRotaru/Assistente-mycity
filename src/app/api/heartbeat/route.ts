import { NextRequest, NextResponse } from "next/server";
import { runCycle } from "@/lib/heartbeat";

export const runtime = "nodejs";
export const maxDuration = 60;

// Il "battito": esegue un giro autonomo. Lo chiama il cron (ogni giorno) oppure
// il pulsante "Aggiorna ora" della dashboard.
// Sicurezza: il cron di Vercel invia "Authorization: Bearer <CRON_SECRET>".
// - Se arriva un token, deve combaciare (cosi' solo il vero cron passa).
// - Se NON arriva alcun token, e' il pulsante manuale dell'app: lo lasciamo
//   passare (proteggi l'app con la Password Protection di Vercel).
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
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
