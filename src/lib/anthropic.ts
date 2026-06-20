import Anthropic from "@anthropic-ai/sdk";

// Modello unico dell'assistente: intelligente ma economico.
export const MODEL = "claude-sonnet-4-6";

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
