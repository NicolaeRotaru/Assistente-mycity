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

// --- Diario: tutto cio' che l'assistente dice e fa, salvato lato server ---
// Cosi resta anche se cambi browser, dispositivo o aggiorni la pagina.

export type DiarioVoce = { tipo: string; titolo: string; testo: string };
export type DiarioRecord = DiarioVoce & { id: string; created_at: string };

/** Salva una voce del diario (chat, giro, azione). */
export async function saveDiarioVoce(v: DiarioVoce): Promise<void> {
  if (!memoryConnected()) return;
  await fetch(`${URL}/rest/v1/diario`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({ tipo: v.tipo, titolo: v.titolo, testo: v.testo }),
  });
}

/** Le ultime voci del diario, dalla piu' recente. */
export async function getDiario(limit = 200): Promise<DiarioRecord[]> {
  if (!memoryConnected()) return [];
  const res = await fetch(
    `${URL}/rest/v1/diario?select=id,created_at,tipo,titolo,testo&order=created_at.desc&limit=${limit}`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) return [];
  return (await res.json()) as DiarioRecord[];
}

/** Svuota il diario (tutte le voci). */
export async function clearDiario(): Promise<void> {
  if (!memoryConnected()) return;
  await fetch(`${URL}/rest/v1/diario?id=not.is.null`, {
    method: "DELETE",
    headers: { ...headers(), Prefer: "return=minimal" },
  });
}

// --- Lavori: il "ponte" verso il cervello (Claude Code sul Max) ---
// La dashboard crea un lavoro "in_attesa"; un worker sul VPS (Claude Code col Max)
// lo prende, lo esegue e ne scrive il risultato. La dashboard mostra l'esito.

export type Lavoro = {
  id: string;
  created_at: string;
  updated_at: string;
  stato: "in_attesa" | "in_corso" | "fatto" | "errore";
  tipo: string;
  richiesta: string;
  risultato: string;
  esperto: string;
};

/** Crea un lavoro per il cervello. Torna la riga creata, o null se non collegato. */
export async function creaLavoro(richiesta: string, tipo = "analisi"): Promise<Lavoro | null> {
  if (!memoryConnected()) return null;
  const res = await fetch(`${URL}/rest/v1/lavori`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({ richiesta, tipo, stato: "in_attesa" }),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Lavoro[];
  return rows[0] || null;
}

/** Ultimi lavori, dal piu' recente. */
export async function getLavori(limit = 50): Promise<Lavoro[]> {
  if (!memoryConnected()) return [];
  const res = await fetch(
    `${URL}/rest/v1/lavori?select=id,created_at,updated_at,stato,tipo,richiesta,risultato,esperto&order=created_at.desc&limit=${limit}`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) return [];
  return (await res.json()) as Lavoro[];
}

/** Svuota i lavori. */
export async function clearLavori(): Promise<void> {
  if (!memoryConnected()) return;
  await fetch(`${URL}/rest/v1/lavori?id=not.is.null`, {
    method: "DELETE",
    headers: { ...headers(), Prefer: "return=minimal" },
  });
}
