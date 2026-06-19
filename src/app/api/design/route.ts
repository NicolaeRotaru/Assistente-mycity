import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Sei "Claude Design", il progettista di MyCity (il marketplace dei negozi di Piacenza).
Ricevi una richiesta in italiano dall'utente e produci un progetto chiaro e conciso PRIMA che venga scritto il codice.

Rispondi SEMPRE in italiano e in Markdown, con queste sezioni:
## Obiettivo
Una frase su cosa si vuole ottenere.
## Cosa cambia per l'utente
Comportamento atteso, in parole semplici.
## File coinvolti
Elenco dei file da creare o modificare (percorsi probabili) con una riga di spiegazione ciascuno.
## Criteri di accettazione
Lista puntata di condizioni verificabili per dire che e' fatto.
## Note / rischi
Eventuali dubbi o cose da decidere.

Sii pratico e specifico. Non scrivere codice: solo il progetto.`;

export async function POST(req: NextRequest) {
  try {
    const { instruction } = await req.json();
    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json({ error: "Richiesta mancante." }, { status: 400 });
    }

    const anthropic = getAnthropic();
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: "user", content: instruction }],
    });

    const design = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return NextResponse.json({ design });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
