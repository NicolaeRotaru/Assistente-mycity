import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM = `Sei l'assistente personale di MyCity, il marketplace dei negozi di Piacenza.
Parli sempre in italiano, in modo chiaro e diretto.
Rispondi alle domande dell'utente in modo semplice e utile.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    // Client creato a ogni richiesta: cosi il build non richiede la chiave.
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM,
      messages,
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return NextResponse.json({ reply: text });
  } catch (e: any) {
    return NextResponse.json({ reply: `Errore: ${e.message}` }, { status: 500 });
  }
}
