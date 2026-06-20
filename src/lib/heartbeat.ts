import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { CUSTOM_TOOLS, executeCustomTool } from "@/lib/tools";
import { saveBriefing, type Briefing } from "@/lib/store";

// Il "giro di perlustrazione" autonomo: l'assistente lavora DA SOLO, anche se
// nessuno gli ha scritto. Perlustra, ragiona, e prepara cosa proporre.

const SYSTEM_PERLUSTRA = `Sei l'AD digitale di MyCity, il marketplace dei negozi di Piacenza.
Questo e' un tuo GIRO DI PERLUSTRAZIONE AUTONOMO: nessuno ti ha scritto, sei tu che ti metti al lavoro.
Obiettivo: far crescere l'azienda (piu' ordini, piu' clienti, piu' incassi, espansione).

Fai cosi':
1. Usa web_search per scoprire cose utili ORA: concorrenti del delivery a Piacenza, trend locali, eventi/meteo che muovono la domanda, idee di marketing che funzionano.
2. Se utile, dai un'occhiata al sito (marketplace_elenco_file / marketplace_leggi_file) per trovare frizioni o miglioramenti.
3. Ragiona in profondita': cosa conviene fare adesso? Quali opportunita' grandi e piccole?

Poi scrivi un'analisi concreta e operativa (non generica). Sii specifico e orientato all'azione.`;

const SYSTEM_BRIEFING = `Trasforma l'analisi in un briefing strutturato per il proprietario.
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
      situazione: { type: "string", description: "Cosa hai scoperto / la situazione, in 2-4 frasi." },
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

const TOOLS: any[] = [
  { type: "web_search_20250305", name: "web_search", max_uses: 2 },
  ...CUSTOM_TOOLS,
];

export async function runCycle(): Promise<Briefing> {
  const anthropic = getAnthropic();

  // FASE 1 — perlustra e ragiona (puo' usare gli strumenti).
  const convo: any[] = [
    { role: "user", content: "Fai ora il tuo giro di perlustrazione e scrivi l'analisi." },
  ];
  let analisi = "";
  for (let i = 0; i < 6; i++) {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1800,
      system: SYSTEM_PERLUSTRA,
      tools: TOOLS,
      messages: convo,
    });
    if (res.stop_reason === "tool_use") {
      convo.push({ role: "assistant", content: res.content });
      const results: any[] = [];
      for (const b of res.content as any[]) {
        if (b.type === "tool_use") {
          const out = await executeCustomTool(b.name, b.input);
          results.push({ type: "tool_result", tool_use_id: b.id, content: out });
        }
      }
      convo.push({ role: "user", content: results });
      continue;
    }
    if (res.stop_reason === "pause_turn") {
      convo.push({ role: "assistant", content: res.content });
      continue;
    }
    analisi = (res.content as any[])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    break;
  }

  // FASE 2 — struttura il briefing.
  const res2 = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_BRIEFING,
    tools: [EMIT],
    tool_choice: { type: "tool", name: "emit_briefing" },
    messages: [{ role: "user", content: `Analisi del giro:\n\n${analisi || "(nessuna)"}` }],
  });
  const block = (res2.content as any[]).find((b) => b.type === "tool_use");
  const briefing: Briefing = block?.input || {
    situazione: analisi || "Nessuna analisi disponibile.",
    opportunita: [],
    azioni: [],
  };

  await saveBriefing(briefing);
  return briefing;
}
