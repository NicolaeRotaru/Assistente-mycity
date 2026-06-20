// Memoria dell'assistente: dove scrive cosa scopre e propone, cosi resta "vivo"
// tra un giro e l'altro. Usa Supabase via REST (nessuna dipendenza extra).
// Se non e' configurato, funziona in modalita' "senza memoria" (i giri non si
// salvano, ma l'assistente gira comunque su richiesta).

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

export type Azione = {
  titolo: string;
  motivo: string;
  livello: "verde" | "giallo" | "rosso";
};
export type Opportunita = {
  titolo: string;
  motivo: string;
  impatto: "alto" | "medio" | "basso";
  sforzo: "alto" | "medio" | "basso";
};
export type Briefing = {
  situazione: string;
  opportunita: Opportunita[];
  azioni: Azione[];
};
export type BriefingRecord = { created_at: string; data: Briefing };

export function memoryConnected(): boolean {
  return Boolean(URL && KEY);
}

function headers() {
  return {
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
  };
}

/** Salva il briefing dell'ultimo giro. */
export async function saveBriefing(data: Briefing): Promise<void> {
  if (!memoryConnected()) return;
  await fetch(`${URL}/rest/v1/briefings`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({ data }),
  });
}

/** Ultimo briefing salvato (o null). */
export async function getLatestBriefing(): Promise<BriefingRecord | null> {
  if (!memoryConnected()) return null;
  const res = await fetch(
    `${URL}/rest/v1/briefings?select=created_at,data&order=created_at.desc&limit=1`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as BriefingRecord[];
  return rows[0] || null;
}

/** Date degli ultimi giri (per mostrare "quanto e' attivo"). */
export async function getRecentTimes(limit = 10): Promise<string[]> {
  if (!memoryConnected()) return [];
  const res = await fetch(
    `${URL}/rest/v1/briefings?select=created_at&order=created_at.desc&limit=${limit}`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as { created_at: string }[];
  return rows.map((r) => r.created_at);
}
