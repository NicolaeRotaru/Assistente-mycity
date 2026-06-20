import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, MODEL, conCache } from "@/lib/anthropic";
import { toolsFor, executeCustomTool } from "@/lib/tools";
import { trovaEsperto, type Esperto } from "@/lib/agents";
import { saveBriefing, type Briefing } from "@/lib/store";
import { getMetriche } from "@/lib/marketplace-db";

// Il giro di perlustrazione autonomo, ora svolto dal TEAM: l'Analista guarda i
// numeri, l'Intelligence cerca opportunita' esterne, l'AD sintetizza il briefing.

const SYSTEM_BRIEFING = `Sei l'AD digitale di MyCity. Sintetizza i contributi del team in un briefing per il proprietario.
Per ogni azione assegna un livello:
- "verde": reversibile e a basso rischio (l'assistente potrebbe farla da solo)
- "giallo": impatto medio (meglio avvisare)
- "rosso": soldi importanti / irreversibile / legale (serve la firma del proprietario)
Sii concreto: niente frasi vaghe.`;

const EMIT: Anthropic.Tool = {
  name: "emit_briefing",
  description: "Restituisce il briefing strutturato.",
  input_schema: {
    type: "object",
    properties: {
      situazione: { type: "string", description: "Cosa e' emerso / la situazione, in 2-4 frasi." },
      opportunita: {
        type: "array",
        description: "Opportunita' per crescere, dalla piu' grande alla piu' piccola.",
        items: {
          type: "object",
          properties: {
            titolo: { type: "string" },
            motivo: { type: "string" },
            impatto: { type: "string", enum: ["alto", "medio", "basso"] },
            sforzo: { type: "string", enum: ["alto", "medio", "basso"] },
          },
          required: ["titolo", "motivo", "impatto", "sforzo"],
        },
      },
      azioni: {
        type: "array",
        description: "Azioni concrete proposte (che il proprietario puo' approvare).",
        items: {
          type: "object",
          properties: {
            titolo: { type: "string" },
            motivo: { type: "string" },
            livello: { type: "string", enum: ["verde", "giallo", "rosso"] },
          },
          required: ["titolo", "motivo", "livello"],
        },
      },
    },
    required: ["situazione", "opportunita", "azioni"],
  },
};

function testo(res: any): string {
  return (res.content as any[])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// Esegue un esperto su un compito, con i suoi strumenti dedicati.
async function runEsperto(anthropic: Anthropic, esperto: Esperto, prompt: string): Promise<string> {
  const convo: any[] = [{ role: "user", content: prompt }];
  const tools = toolsFor(esperto.strumenti);
  for (let i = 0; i < 5; i++) {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: esperto.system,
      tools,
      messages: conCache(convo),
    });
    if (res.stop_reason === "tool_use") {
      convo.push({ role: "assistant", content: res.content });
      const results: any[] = [];
      for (const b of res.content as any[]) {
        if (b.type === "tool_use") results.push({ type: "tool_result", tool_use_id: b.id, content: await executeCustomTool(b.name, b.input) });
      }
      convo.push({ role: "user", content: results });
      continue;
    }
    if (res.stop_reason === "pause_turn") {
      convo.push({ role: "assistant", content: res.content });
      continue;
    }
    return testo(res);
  }
  return "";
}

async function sicuro(p: Promise<string>): Promise<string> {
  try {
    return await p;
  } catch {
    return "";
  }
}

export async function runCycle(): Promise<Briefing> {
  const anthropic = getAnthropic();

  // 1) Dati reali (grounding).
  const m = await getMetriche();
  const datiTxt = m.connected
    ? `Dati reali attuali del marketplace mycity:\n${JSON.stringify(m, null, 2)}`
    : "Il database del marketplace non e' collegato: niente dati reali, lavora su ipotesi e segnala che servono i dati.";

  // 2) L'Analista studia i numeri reali (leggero ed economico: niente ricerca web nel giro).
  const analista = trovaEsperto("analista");
  const interna = await sicuro(
    runEsperto(anthropic, analista, `${datiTxt}\n\nAnalizza i numeri reali: cosa va bene/male e quali opportunita' di crescita concrete vedi? Sii specifico.`)
  );

  // 3) L'AD sintetizza il briefing.
  const contributi = `Analisi dell'Analista (dati interni):\n${interna || "(nessuna)"}\n\nDati di riferimento:\n${datiTxt}`;
  const res2 = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_BRIEFING,
    tools: [EMIT],
    tool_choice: { type: "tool", name: "emit_briefing" },
    messages: [{ role: "user", content: contributi }],
  });
  const block = (res2.content as any[]).find((b) => b.type === "tool_use");
  const briefing: Briefing = block?.input || {
    situazione: interna || datiTxt,
    opportunita: [],
    azioni: [],
  };

  await saveBriefing(briefing);
  return briefing;
}
