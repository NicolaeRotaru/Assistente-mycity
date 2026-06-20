import { NextRequest, NextResponse } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { executeCustomTool, toolsFor } from "@/lib/tools";
import { trovaEsperto, tuttiGliEsperti } from "@/lib/agents";

export const runtime = "nodejs";
export const maxDuration = 60;

// L'AD smista il messaggio all'esperto piu' adatto.
async function scegliEsperto(anthropic: any, messaggio: string): Promise<string> {
  const team = tuttiGliEsperti();
  const ids = team.map((e) => e.id);
  const elenco = team.map((e) => `${e.id}: ${e.nome} — ${e.ruolo}`).join("\n");
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 80,
      system: `Sei lo smistatore del team MyCity. Scegli l'esperto piu' adatto a gestire il messaggio dell'utente.
Esperti:
${elenco}
Se la richiesta e' generica, strategica o tocca piu' reparti, scegli "ad".`,
      tools: [
        {
          name: "scegli",
          description: "Sceglie l'esperto che gestira' il messaggio.",
          input_schema: { type: "object", properties: { esperto: { type: "string", enum: ids } }, required: ["esperto"] },
        },
      ],
      tool_choice: { type: "tool", name: "scegli" },
      messages: [{ role: "user", content: messaggio }],
    });
    const b = (res.content as any[]).find((x) => x.type === "tool_use");
    return b?.input?.esperto || "ad";
  } catch {
    return "ad";
  }
}

// Ciclo agentico: chiama il modello, esegue gli strumenti, ripete fino alla risposta.
async function eseguiLoop(
  anthropic: any,
  system: string,
  tools: any[],
  convo: any[]
): Promise<{ reply: string; toolsUsed: string[] }> {
  const toolsUsed = new Set<string>();
  let reply = "";
  for (let i = 0; i < 8; i++) {
    const res = await anthropic.messages.create({ model: MODEL, max_tokens: 2000, system, tools, messages: convo });
    for (const block of res.content as any[]) {
      if (block.type === "tool_use" || block.type === "server_tool_use") toolsUsed.add(block.name);
    }
    if (res.stop_reason === "tool_use") {
      convo.push({ role: "assistant", content: res.content });
      const results: any[] = [];
      for (const block of res.content as any[]) {
        if (block.type === "tool_use") {
          results.push({ type: "tool_result", tool_use_id: block.id, content: await executeCustomTool(block.name, block.input) });
        }
      }
      convo.push({ role: "user", content: results });
      continue;
    }
    if (res.stop_reason === "pause_turn") {
      convo.push({ role: "assistant", content: res.content });
      continue;
    }
    reply = (res.content as any[]).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    break;
  }
  return { reply, toolsUsed: [...toolsUsed] };
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const anthropic = getAnthropic();

    const ultimo = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    const esperto = trovaEsperto(await scegliEsperto(anthropic, String(ultimo)));
    const tools = toolsFor(esperto.strumenti);

    let out: { reply: string; toolsUsed: string[] };
    try {
      out = await eseguiLoop(anthropic, esperto.system, tools, [...messages]);
    } catch {
      // Ripiego: riprova senza ricerca web (es. se non e' attiva sull'account).
      const senzaWeb = tools.filter((t: any) => t.name !== "web_search");
      out = await eseguiLoop(anthropic, esperto.system, senzaWeb, [...messages]);
    }

    return NextResponse.json({
      reply: out.reply || "Non sono riuscito a completare la risposta. Riprova.",
      toolsUsed: out.toolsUsed,
      esperto: { id: esperto.id, nome: esperto.nome, emoji: esperto.emoji, ruolo: esperto.ruolo },
    });
  } catch (e: any) {
    return NextResponse.json({ reply: `Errore: ${e.message}` }, { status: 500 });
  }
}
