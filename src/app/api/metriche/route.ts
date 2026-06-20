import { NextResponse } from "next/server";
import { getMetriche } from "@/lib/marketplace-db";
import { getPostHog } from "@/lib/posthog";

export const runtime = "nodejs";

// Le metriche del cruscotto: dati del marketplace (mycity) + traffico (PostHog).
export async function GET() {
  const m: any = await getMetriche();
  const ph = await getPostHog();
  if (ph.connected) {
    m.connected = true;
    m.visite_7g = ph.visite_7g;
    const ordini7 = Number(m.ordini_7g) || 0;
    m.conversione = ph.visitatori_7g ? Math.round((ordini7 / ph.visitatori_7g) * 1000) / 10 : 0;
  }
  return NextResponse.json(m);
}
