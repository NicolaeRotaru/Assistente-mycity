// Lettura SOLA-LETTURA dal database del MARKETPLACE (mycity), separato dalla
// memoria dell'assistente. Usa Supabase/PostgREST via fetch (solo richieste GET).

const URL = process.env.MARKETPLACE_SUPABASE_URL;
const KEY = process.env.MARKETPLACE_SUPABASE_KEY;

export function marketplaceDbConnected(): boolean {
  return Boolean(URL && KEY);
}

const NON_COLLEGATO =
  "Database del marketplace non collegato. Servono MARKETPLACE_SUPABASE_URL e MARKETPLACE_SUPABASE_KEY (di sola lettura) nelle variabili d'ambiente.";

function headers(extra?: Record<string, string>) {
  return {
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
    ...(extra || {}),
  };
}

/** Elenco delle tabelle del database del marketplace. */
export async function listTables(): Promise<string> {
  if (!marketplaceDbConnected()) return NON_COLLEGATO;
  try {
    const res = await fetch(`${URL}/rest/v1/`, { headers: headers(), cache: "no-store" });
    const data: any = await res.json();
    if (!res.ok) return `Errore: ${data.message || res.status}`;
    // PostgREST espone le tabelle in "definitions" (swagger) o nei "paths".
    let tabelle: string[] = [];
    if (data.definitions) tabelle = Object.keys(data.definitions);
    else if (data.paths) tabelle = Object.keys(data.paths).map((p) => p.replace(/^\//, "")).filter(Boolean);
    tabelle = tabelle.filter((t) => t && !t.startsWith("rpc/"));
    return tabelle.length
      ? `Tabelle nel marketplace:\n${tabelle.join("\n")}`
      : "Nessuna tabella visibile (controlla i permessi della chiave).";
  } catch (e: any) {
    return `Errore leggendo le tabelle: ${e.message}`;
  }
}

/** Legge righe da una tabella del marketplace (con conteggio totale). */
export async function queryTable(opts: {
  tabella: string;
  select?: string;
  filtro?: string;
  ordina?: string;
  limite?: number;
}): Promise<string> {
  if (!marketplaceDbConnected()) return NON_COLLEGATO;
  const tabella = String(opts.tabella || "").trim();
  if (!/^[a-zA-Z0-9_]+$/.test(tabella)) return "Nome tabella non valido.";

  const limite = Math.min(Math.max(Number(opts.limite) || 20, 1), 100);
  const params = new URLSearchParams();
  params.set("select", opts.select?.trim() || "*");
  if (opts.ordina?.trim()) params.set("order", opts.ordina.trim());
  params.set("limit", String(limite));
  // filtro: stringa PostgREST tipo "created_at=gte.2026-06-01" (puo' avere piu' coppie con &)
  const filtroQS = opts.filtro?.trim() ? "&" + opts.filtro.trim() : "";

  try {
    const res = await fetch(`${URL}/rest/v1/${tabella}?${params.toString()}${filtroQS}`, {
      headers: headers({ Prefer: "count=exact" }),
      cache: "no-store",
    });
    const data: any = await res.json();
    if (!res.ok) return `Errore query su ${tabella}: ${data.message || res.status}`;
    // Totale dal Content-Range (es. "0-19/12345").
    const range = res.headers.get("content-range") || "";
    const totale = range.includes("/") ? range.split("/")[1] : "?";
    let righe = JSON.stringify(data, null, 2);
    if (righe.length > 8000) righe = righe.slice(0, 8000) + "\n[...troncato]";
    return `Tabella "${tabella}" — totale righe: ${totale} (ne mostro fino a ${limite}):\n${righe}`;
  } catch (e: any) {
    return `Errore query su ${tabella}: ${e.message}`;
  }
}

async function selectRows(table: string, qs: string): Promise<any[]> {
  // Resiliente: se una tabella non e' leggibile, non blocca le altre metriche.
  try {
    const res = await fetch(`${URL}/rest/v1/${table}?${qs}`, { headers: headers(), cache: "no-store" });
    if (!res.ok) return [];
    const d = await res.json();
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export type Metriche = {
  connected: boolean;
  error?: string;
  [k: string]: number | boolean | string | undefined;
};

/**
 * Calcola le metriche del cruscotto leggendo (SOLA LETTURA) le tabelle del
 * marketplace. Nessuna modifica al database: solo GET, aggregazione lato app.
 */
export async function getMetriche(): Promise<Metriche> {
  if (!marketplaceDbConnected()) return { connected: false };
  try {
    const [orders, profiles, carts, reviews] = await Promise.all([
      selectRows("orders", "select=total_price,payment_status,delivery_status,created_at,delivered_at,user_id&limit=10000"),
      selectRows("profiles", "select=role,created_at&limit=10000"),
      selectRows("abandoned_carts", "select=recovered&limit=10000"),
      selectRows("store_reviews", "select=rating&limit=10000"),
    ]);

    const now = Date.now();
    const d7 = now - 7 * 86400000;
    const d30 = now - 30 * 86400000;
    const romeFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" });
    const oggi = romeFmt.format(new Date());
    const t = (iso: string) => new Date(iso).getTime();
    const isOggi = (iso: string) => romeFmt.format(new Date(iso)) === oggi;
    const notFailed = (o: any) => o.payment_status !== "FAILED";
    const paid = (o: any) => o.payment_status === "PAID";
    const num = (v: any) => Number(v) || 0;

    const paidAll = orders.filter(paid);
    const delivered = orders.filter((o) => o.delivered_at);
    const ratings = reviews.map((r) => num(r.rating)).filter((n) => n > 0);

    const ultimoOrdine: Record<string, number> = {};
    for (const o of orders) {
      if (o.user_id) ultimoOrdine[o.user_id] = Math.max(ultimoOrdine[o.user_id] || 0, t(o.created_at));
    }

    return {
      connected: true,
      ordini_oggi: orders.filter((o) => notFailed(o) && isOggi(o.created_at)).length,
      ordini_7g: orders.filter((o) => notFailed(o) && t(o.created_at) >= d7).length,
      incasso_oggi: orders.filter((o) => paid(o) && isOggi(o.created_at)).reduce((s, o) => s + num(o.total_price), 0),
      incasso_7g: orders.filter((o) => paid(o) && t(o.created_at) >= d7).reduce((s, o) => s + num(o.total_price), 0),
      scontrino_medio: paidAll.length ? paidAll.reduce((s, o) => s + num(o.total_price), 0) / paidAll.length : 0,
      carrelli: carts.filter((c) => c.recovered !== true).length,
      nuovi_clienti_7g: profiles.filter((p) => p.role === "buyer" && t(p.created_at) >= d7).length,
      clienti: profiles.filter((p) => p.role === "buyer").length,
      negozi: profiles.filter((p) => p.role === "seller").length,
      consegne_in_corso: orders.filter((o) => notFailed(o) && !["DELIVERED", "CANCELED"].includes(o.delivery_status)).length,
      tempo_consegna_min: delivered.length
        ? Math.round(delivered.reduce((s, o) => s + (t(o.delivered_at) - t(o.created_at)) / 60000, 0) / delivered.length)
        : 0,
      problemi: orders.filter((o) => o.delivery_status === "CANCELED").length,
      recensione_media: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0,
      clienti_dormienti: Object.values(ultimoOrdine).filter((tt) => tt < d30).length,
    };
  } catch (e: any) {
    return { connected: false, error: e.message };
  }
}
