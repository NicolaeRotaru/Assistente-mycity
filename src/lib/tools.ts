import type Anthropic from "@anthropic-ai/sdk";
import { listMarketplaceFiles, readMarketplaceFile } from "@/lib/github";

// Strumenti "custom": eseguiti dal nostro server (a differenza di web_search,
// che e' un tool lato Anthropic). In v1 sono in SOLA LETTURA sul marketplace.
export const CUSTOM_TOOLS: Anthropic.Tool[] = [
  {
    name: "marketplace_elenco_file",
    description:
      "Restituisce l'elenco dei file del marketplace MyCity (repo mycity). Usalo per capire com'e' fatto il sito prima di leggere un file.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "marketplace_leggi_file",
    description:
      "Legge il contenuto di un file del marketplace MyCity. Indica il percorso esatto (es. 'src/app/page.tsx').",
    input_schema: {
      type: "object",
      properties: {
        percorso: { type: "string", description: "Percorso del file dalla root del repo." },
      },
      required: ["percorso"],
    },
  },
];

// Etichette leggibili per mostrare in chat cosa ha usato l'assistente.
export const TOOL_LABELS: Record<string, string> = {
  web_search: "Ricerca sul web",
  marketplace_elenco_file: "Elenco file del marketplace",
  marketplace_leggi_file: "Lettura file del marketplace",
};

export async function executeCustomTool(name: string, input: any): Promise<string> {
  switch (name) {
    case "marketplace_elenco_file":
      return listMarketplaceFiles();
    case "marketplace_leggi_file":
      return readMarketplaceFile(String(input?.percorso || ""));
    default:
      return `Strumento sconosciuto: ${name}`;
  }
}
