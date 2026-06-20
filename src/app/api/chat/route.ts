import { NextRequest, NextResponse } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { CUSTOM_TOOLS, executeCustomTool } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Sei l'assistente personale di MyCity, il marketplace dei negozi di Piacenza.
Sei un co-pilota di business: non solo rispondi, ma USI strumenti per scoprire cose e aiutare a far crescere l'azienda.

Strumenti a disposizione:
- web_search: cerca sul web (concorrenti, trend locali, idee, prezzi, eventi). Usalo quando serve informazione aggiornata o esterna.
- marketplace_elenco_file + marketplace_leggi_file: analizzano il codice del sito MyCity (sola lettura). Usali per capire come funziona il sito o trovare problemi/opportunita'.

Regole:
- Parla sempre in italiano, in modo chiaro e concreto.
- Quando proponi azioni, spiega prima cosa faresti (mai sorprese).
- Sei in SOLA LETTURA: analizzi e proponi, non modifichi nulla.
- Se ti chiedono qualcosa che richiede dati che non hai ancora (ordini, incassi), dillo e indica cosa servirebbe collegare.`;

// web_search e' un tool lato Anthropic; i CUSTOM_TOOLS li eseguiamo noi.
const TOOLS: any[] = [
  { type: "web_search_20250305", name: "web_search", max_uses: 5 },
  ...CUSTOM_TOOLS,
];

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const anthropic = getAnthropic();

    const convo: any[] = [...messages];
    const toolsUsed = new Set<string>();
    let reply = "";

    // Ciclo agentico: il modello puo' chiamare piu' strumenti prima di rispondere.
    for (let i = 0; i < 8; i++) {
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM,
        tools: TOOLS,
        messages: convo,
      });

      for (const block of res.content as any[]) {
        if (block.type === "tool_use" || block.type === "server_tool_use") {
          toolsUsed.add(block.name);
        }
      }

      if (res.stop_reason === "tool_use") {
        // Strumenti nostri (custom): li eseguiamo e rimandiamo i risultati.
        convo.push({ role: "assistant", content: res.content });
        const results: any[] = [];
        for (const block of res.content as any[]) {
          if (block.type === "tool_use") {
            const out = await executeCustomTool(block.name, block.input);
            results.push({ type: "tool_result", tool_use_id: block.id, content: out });
          }
        }
        convo.push({ role: "user", content: results });
        continue;
      }

      if (res.stop_reason === "pause_turn") {
        // Ricerca web in corso lato Anthropic: rimanda per continuare.
        convo.push({ role: "assistant", content: res.content });
        continue;
      }

      // end_turn: risposta finale.
      reply = (res.content as any[])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }

    if (!reply) reply = "Non sono riuscito a completare la risposta. Riprova.";
    return NextResponse.json({ reply, toolsUsed: [...toolsUsed] });
  } catch (e: any) {
    return NextResponse.json({ reply: `Errore: ${e.message}` }, { status: 500 });
  }
}
