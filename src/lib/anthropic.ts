import Anthropic from "@anthropic-ai/sdk";

// Modello principale (qualita') e modello economico (compiti semplici/router).
export const MODEL = "claude-sonnet-4-6";
export const MODEL_FAST = "claude-haiku-4-5";

// Client creato a ogni chiamata: cosi il build non richiede la chiave.
export function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY mancante. Aggiungila in .env.local (locale) o nelle Environment Variables di Vercel."
    );
  }
  return new Anthropic({ apiKey });
}

// Prompt caching: mette un "punto di cache" sull'ultimo blocco del turno utente.
// Le parti ripetute (istruzioni di sistema, strumenti, storico della conversazione)
// nelle chiamate successive costano ~10% invece del 100%. Sicuro: se il prefisso e'
// troppo corto, l'API semplicemente non mette nulla in cache (nessun errore).
export function conCache(messages: any[]): any[] {
  if (!messages.length) return messages;
  const ultimo = messages[messages.length - 1];
  if (!ultimo || ultimo.role !== "user") return messages;
  let content: any = ultimo.content;
  if (typeof content === "string") content = [{ type: "text", text: content }];
  else if (Array.isArray(content)) content = content.slice();
  else return messages;
  const i = content.length - 1;
  if (i < 0) return messages;
  content[i] = { ...content[i], cache_control: { type: "ephemeral" } };
  const out = messages.slice();
  out[out.length - 1] = { ...ultimo, content };
  return out;
}
