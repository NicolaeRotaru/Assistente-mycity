import { NextResponse } from "next/server";
import { getLatestBriefing, getRecentTimes, memoryConnected } from "@/lib/store";

export const runtime = "nodejs";

// Cio' che la dashboard mostra: l'ultimo briefing e quanto e' "attivo".
export async function GET() {
  try {
    const [latest, recent] = await Promise.all([
      getLatestBriefing(),
      getRecentTimes(10),
    ]);
    return NextResponse.json({
      memoria: memoryConnected(),
      ultimo: latest,
      giri: recent,
    });
  } catch (e: any) {
    return NextResponse.json({ memoria: false, ultimo: null, giri: [], error: e.message });
  }
}
