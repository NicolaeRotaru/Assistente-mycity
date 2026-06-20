import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { CUSTOM_TOOLS, executeCustomTool } from "@/lib/tools";
import { saveBriefing, type Briefing } from "@/lib/store";
import { getMetriche } from "@/lib/marketplace-db";

// Il "giro di perlustrazione" autonomo: l'assistente lavora DA SOLO, anche se
// nessuno gli ha scritto. Parte SEMPRE dai dati reali del marketplace, poi
// ragiona e prepara cosa proporre.

const SYSTEM_PERLUSTRA = `Sei l'AD digitale di MyCity, il marketplace dei negozi di Piacenza.
Questo e' un tuo GIRO DI PERLUSTRAZIONE AUTONOMO: nessuno ti ha scritto, sei tu che ti metti al lavoro.
Ricevi i DATI REALI attuali dell'azienda. Il tuo compito: leggerli, capire cosa sta succedendo e individuare opportunita' concrete per far crescere l'azienda (piu' ordini, piu' clienti, piu' incassi).

Puoi approfondire con gli strumenti (dati_query per dettagli dal database, marketplace_* per il codice del sito), ma hai gia' i numeri principali: usali.
Scrivi un'analisi concreta e operativa, specifica e orientata all'azione. Niente frasi generiche.`;

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

const TOOLS: any[] = [...CUSTOM_TOOLS]; // niente web_search nel giro: piu' veloce, economico e affidabile

function testo(res: any): string {
  return (res.content as any[])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

async function perlustra(anthropic: Anthropic, datiTxt: string): Promise<string> {
  const convo: any[] = [
    {
      role: "user",
      content: `${datiTxt}\n\nFai ora il tuo giro: analizza questi numeri, se serve approfondisci, e scrivi un'analisi con opportunita' di crescita concrete.`,
    },
  ];
  for (let i = 0; i < 5; i++) {
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
          results.push({ type: "tool_result", tool_use_id: b.id, content: await executeCustomTool(b.name, b.input) });
        }
      }
      convo.push({ role: "user", content: results });
      continue;
    }
    return testo(res);
  }
  return "";
}

export async function runCycle(): Promise<Briefing> {
  const anthropic = getAnthropic();

  // 1) Parte SEMPRE dai dati reali.
  const m = await getMetriche();
  const datiTxt = m.connected
    ? `Dati reali attuali del marketplace mycity:\n${JSON.stringify(m, null, 2)}`
    : "Il database del marketplace non e' ancora collegato: non hai dati reali, lavora su ipotesi generali e segnala che servono i dati.";

  // 2) Analizza (con strumenti, ma resiliente: se qualcosa fallisce, ripiego).
  let analisi = "";
  try {
    analisi = await perlustra(anthropic, datiTxt);
  } catch {
    analisi = "";
  }
  if (!analisi) {
    try {
      const r = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM_PERLUSTRA,
        messages: [{ role: "user", content: `${datiTxt}\n\nScrivi un'analisi concreta e idee di crescita basate su questi numeri.` }],
      });
      analisi = testo(r);
    } catch {
      /* ignora */
    }
  }
  if (!analisi) analisi = datiTxt;

  // 3) Struttura il briefing.
  const res2 = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_BRIEFING,
    tools: [EMIT],
    tool_choice: { type: "tool", name: "emit_briefing" },
    messages: [{ role: "user", content: `Analisi del giro:\n\n${analisi}` }],
  });
  const block = (res2.content as any[]).find((b) => b.type === "tool_use");
  const briefing: Briefing = block?.input || {
    situazione: analisi,
    opportunita: [],
    azioni: [],
  };

  await saveBriefing(briefing);
  return briefing;
}
