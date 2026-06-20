import type Anthropic from "@anthropic-ai/sdk";
import { listMarketplaceFiles, readMarketplaceFile } from "@/lib/github";
import { listTables, queryTable } from "@/lib/marketplace-db";
import { listNotes, readNote, writeNote } from "@/lib/obsidian";

// Strumenti "custom": eseguiti dal nostro server (a differenza di web_search,
// che e' un tool lato Anthropic). In v1 sono in SOLA LETTURA.
export const CUSTOM_TOOLS: Anthropic.Tool[] = [
  {
    name: "marketplace_elenco_file",
    description:
      "Restituisce l'elenco dei file del CODICE del marketplace MyCity (repo mycity). Per capire com'e' fatto il sito.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "marketplace_leggi_file",
    description:
      "Legge il contenuto di un file del CODICE del marketplace MyCity. Indica il percorso (es. 'src/app/page.tsx').",
    input_schema: {
      type: "object",
      properties: {
        percorso: { type: "string", description: "Percorso del file dalla root del repo." },
      },
      required: ["percorso"],
    },
  },
  {
    name: "dati_tabelle",
    description:
      "Elenca le tabelle del DATABASE del marketplace MyCity (ordini, clienti, ecc.). Usalo per scoprire dove sono i dati prima di interrogarli.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "dati_query",
    description:
      "Legge righe dal DATABASE del marketplace MyCity (sola lettura), con conteggio totale. Per rispondere a domande sui dati reali (es. ordini di oggi, clienti, incassi).",
    input_schema: {
      type: "object",
      properties: {
        tabella: { type: "string", description: "Nome della tabella (vedi dati_tabelle)." },
        select: { type: "string", description: "Colonne, es. 'id,totale,created_at' (default tutte)." },
        filtro: {
          type: "string",
          description:
            "Filtro in stile PostgREST, es. 'created_at=gte.2026-06-20' oppure 'stato=eq.consegnato'. Piu' condizioni separate da &.",
        },
        ordina: { type: "string", description: "Ordinamento, es. 'created_at.desc'." },
        limite: { type: "number", description: "Quante righe (1-100, default 20)." },
      },
      required: ["tabella"],
    },
  },
  {
    name: "obsidian_cerca",
    description:
      "Elenca le note Obsidian (la memoria del business: decisioni, idee, roadmap, contesto). Filtro opzionale sul nome/percorso.",
    input_schema: {
      type: "object",
      properties: {
        filtro: { type: "string", description: "Parola per filtrare i nomi delle note (opzionale)." },
      },
    },
  },
  {
    name: "obsidian_leggi",
    description: "Legge il contenuto di una nota Obsidian. Indica il percorso (es. 'Decisioni/Resi.md').",
    input_schema: {
      type: "object",
      properties: {
        percorso: { type: "string", description: "Percorso della nota nel vault." },
      },
      required: ["percorso"],
    },
  },
  {
    name: "obsidian_scrivi",
    description:
      "Crea o aggiorna una nota Obsidian (memoria del business). Usalo per salvare decisioni, idee o riepiloghi, di solito quando l'utente lo chiede o conferma.",
    input_schema: {
      type: "object",
      properties: {
        percorso: { type: "string", description: "Percorso della nota (es. 'Decisioni/2026.md')." },
        contenuto: { type: "string", description: "Testo in Markdown." },
        aggiungi: { type: "boolean", description: "Se true, accoda in fondo alla nota esistente invece di sovrascrivere." },
      },
      required: ["percorso", "contenuto"],
    },
  },
];

// Etichette leggibili per mostrare in chat cosa ha usato l'assistente.
export const TOOL_LABELS: Record<string, string> = {
  web_search: "Ricerca web",
  marketplace_elenco_file: "Elenco file del sito",
  marketplace_leggi_file: "Lettura file del sito",
  dati_tabelle: "Tabelle del marketplace",
  dati_query: "Dati del marketplace",
  obsidian_cerca: "Note Obsidian",
  obsidian_leggi: "Lettura nota Obsidian",
  obsidian_scrivi: "Scrittura nota Obsidian",
};

export async function executeCustomTool(name: string, input: any): Promise<string> {
  switch (name) {
    case "marketplace_elenco_file":
      return listMarketplaceFiles();
    case "marketplace_leggi_file":
      return readMarketplaceFile(String(input?.percorso || ""));
    case "dati_tabelle":
      return listTables();
    case "dati_query":
      return queryTable({
        tabella: String(input?.tabella || ""),
        select: input?.select,
        filtro: input?.filtro,
        ordina: input?.ordina,
        limite: input?.limite,
      });
    case "obsidian_cerca":
      return listNotes(input?.filtro);
    case "obsidian_leggi":
      return readNote(String(input?.percorso || ""));
    case "obsidian_scrivi":
      return writeNote(String(input?.percorso || ""), String(input?.contenuto || ""), Boolean(input?.aggiungi));
    default:
      return `Strumento sconosciuto: ${name}`;
  }
}

// web_search e' un tool lato Anthropic (non in CUSTOM_TOOLS).
export const WEB_SEARCH_TOOL: any = { type: "web_search_20250305", name: "web_search", max_uses: 5 };

// Costruisce la lista di strumenti per un esperto, dato l'elenco dei nomi permessi.
export function toolsFor(allowed: string[]): any[] {
  const out: any[] = [];
  if (allowed.includes("web_search")) out.push(WEB_SEARCH_TOOL);
  for (const t of CUSTOM_TOOLS) if (allowed.includes(t.name)) out.push(t);
  return out;
}
