// Lettura statistiche dal sito via PostHog (visite, visitatori) per le metriche
// "Visite sito" e "Conversione". Best-effort: se non collegato, torna connected:false.

const HOST = process.env.POSTHOG_HOST; // es. https://eu.posthog.com oppure https://us.posthog.com
const PROJECT = process.env.POSTHOG_PROJECT_ID;
const KEY = process.env.POSTHOG_API_KEY; // Personal API key (lettura)

export function posthogConnected(): boolean {
  return Boolean(HOST && PROJECT && KEY);
}

async function hogql(query: string): Promise<number> {
  const r = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    cache: "no-store",
  });
  const d: any = await r.json();
  if (!r.ok) throw new Error(d.detail || `PostHog ${r.status}`);
  return Number(d.results?.[0]?.[0]) || 0;
}

export async function getPostHog(): Promise<{ connected: boolean; visite_7g?: number; visitatori_7g?: number }> {
  if (!posthogConnected()) return { connected: false };
  try {
    const visite = await hogql(
      "select count() from events where event = '$pageview' and timestamp >= now() - interval 7 day"
    );
    const visitatori = await hogql(
      "select count(distinct person_id) from events where event = '$pageview' and timestamp >= now() - interval 7 day"
    );
    return { connected: true, visite_7g: visite, visitatori_7g: visitatori };
  } catch {
    return { connected: false };
  }
}
