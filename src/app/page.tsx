"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  Wrench,
  RefreshCw,
  Activity,
  TrendingUp,
  CheckCircle2,
  Package,
  Euro,
  Receipt,
  UserPlus,
  Users,
  Store,
  Bike,
  AlertTriangle,
  Percent,
  BarChart3,
  Eye,
  ShoppingCart,
  UserMinus,
  Clock,
  Star,
  Trash2,
  History,
  Copy,
  FileText,
  Brain,
} from "lucide-react";

type Livello = "verde" | "giallo" | "rosso";
type Azione = { titolo: string; motivo: string; livello: Livello };
type Opportunita = {
  titolo: string;
  motivo: string;
  impatto: string;
  sforzo: string;
};
type Briefing = { situazione: string; opportunita: Opportunita[]; azioni: Azione[] };
type Msg = {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
  esperto?: { nome: string; emoji: string };
  prompt?: boolean;
};
type DiarioVoce = {
  id: number | string;
  at: string;
  tipo: "chat" | "briefing" | "azione";
  titolo: string;
  testo: string;
};

const DIARIO_TIPO: Record<DiarioVoce["tipo"], string> = {
  chat: "💬 Chat",
  briefing: "🔭 Giro",
  azione: "⚡ Azione",
};

type Lavoro = {
  id: string;
  created_at: string;
  updated_at: string;
  stato: "in_attesa" | "in_corso" | "fatto" | "errore";
  tipo: string;
  richiesta: string;
  risultato: string;
  esperto: string;
};

const LAVORO_STATO: Record<string, { label: string; cls: string }> = {
  in_attesa: { label: "⏳ In attesa", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  in_corso: { label: "⚙️ In corso", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  fatto: { label: "✅ Fatto", cls: "bg-green-50 text-green-700 ring-green-200" },
  errore: { label: "⚠️ Errore", cls: "bg-red-50 text-red-700 ring-red-200" },
};

const TEAM = [
  { emoji: "🧠", nome: "Direzione (AD)", ruolo: "Strategia e coordinamento" },
  { emoji: "🎧", nome: "Supporto clienti", ruolo: "Clienti e reclami" },
  { emoji: "🛵", nome: "Operations", ruolo: "Ordini, rider, consegne" },
  { emoji: "📣", nome: "Marketing/Growth", ruolo: "Contenuti e acquisizione" },
  { emoji: "🤝", nome: "Vendite/Onboarding", ruolo: "Negozi" },
  { emoji: "📊", nome: "Analista", ruolo: "KPI e report" },
  { emoji: "💶", nome: "Finanza", ruolo: "Incassi e pagamenti" },
  { emoji: "🛠️", nome: "Tech", ruolo: "Analisi del sito" },
  { emoji: "🔎", nome: "Intelligence", ruolo: "Concorrenti e trend" },
];

const TOOL_LABELS: Record<string, string> = {
  web_search: "Ricerca web",
  marketplace_elenco_file: "Elenco file del sito",
  marketplace_leggi_file: "Lettura file del sito",
  dati_tabelle: "Tabelle del marketplace",
  dati_query: "Dati del marketplace",
  obsidian_cerca: "Note Obsidian",
  obsidian_leggi: "Lettura nota Obsidian",
  obsidian_scrivi: "Scrittura nota Obsidian",
};
const COLORI: Record<Livello, string> = {
  verde: "border-green-300 bg-green-50 text-green-800",
  giallo: "border-amber-300 bg-amber-50 text-amber-800",
  rosso: "border-red-300 bg-red-50 text-red-800",
};

// Le 16 metriche piu' importanti per un marketplace di consegne (cockpit completo).
// "chiave" = campo restituito da /api/metriche; senza chiave = fonte non ancora
// collegata (es. PostHog). "tipo" = come formattare il numero.
type Tipo = "n" | "euro" | "durata" | "stelle" | "perc";
const METRICHE: {
  icon: React.ReactNode;
  label: string;
  fonte: string;
  chiave?: string;
  tipo?: Tipo;
}[] = [
  { icon: <Package size={16} />, label: "Ordini oggi", fonte: "mycity", chiave: "ordini_oggi", tipo: "n" },
  { icon: <BarChart3 size={16} />, label: "Ordini 7 giorni", fonte: "mycity", chiave: "ordini_7g", tipo: "n" },
  { icon: <Euro size={16} />, label: "Incasso oggi", fonte: "mycity", chiave: "incasso_oggi", tipo: "euro" },
  { icon: <TrendingUp size={16} />, label: "Incasso 7 giorni", fonte: "mycity", chiave: "incasso_7g", tipo: "euro" },
  { icon: <Receipt size={16} />, label: "Scontrino medio", fonte: "mycity", chiave: "scontrino_medio", tipo: "euro" },
  { icon: <Eye size={16} />, label: "Visite sito (7gg)", fonte: "PostHog", chiave: "visite_7g", tipo: "n" },
  { icon: <Percent size={16} />, label: "Conversione", fonte: "PostHog", chiave: "conversione", tipo: "perc" },
  { icon: <ShoppingCart size={16} />, label: "Carrelli abbandonati", fonte: "mycity", chiave: "carrelli", tipo: "n" },
  { icon: <UserPlus size={16} />, label: "Nuovi clienti (7gg)", fonte: "mycity", chiave: "nuovi_clienti_7g", tipo: "n" },
  { icon: <Users size={16} />, label: "Clienti attivi", fonte: "mycity", chiave: "clienti", tipo: "n" },
  { icon: <UserMinus size={16} />, label: "Clienti dormienti", fonte: "mycity", chiave: "clienti_dormienti", tipo: "n" },
  { icon: <Store size={16} />, label: "Negozi attivi", fonte: "mycity", chiave: "negozi", tipo: "n" },
  { icon: <Bike size={16} />, label: "Consegne in corso", fonte: "mycity", chiave: "consegne_in_corso", tipo: "n" },
  { icon: <Clock size={16} />, label: "Tempo medio consegna", fonte: "mycity", chiave: "tempo_consegna_min", tipo: "durata" },
  { icon: <AlertTriangle size={16} />, label: "Problemi / ritardi", fonte: "mycity", chiave: "problemi", tipo: "n" },
  { icon: <Star size={16} />, label: "Recensione media", fonte: "mycity", chiave: "recensione_media", tipo: "stelle" },
];

function formatta(v: any, tipo?: Tipo): string {
  if (v === undefined || v === null) return "—";
  if (tipo === "euro") return "€ " + Number(v).toLocaleString("it-IT", { maximumFractionDigits: 2 });
  if (tipo === "durata") {
    const min = Number(v);
    if (!min) return "—";
    return min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}m` : `${Math.round(min)} min`;
  }
  if (tipo === "stelle") {
    const r = Number(v);
    return r > 0 ? `${r}/5` : "—";
  }
  if (tipo === "perc") return `${Number(v)}%`;
  return String(v);
}

function fa(iso: string | null): string {
  if (!iso) return "mai";
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 90) return "poco fa";
  if (sec < 3600) return `${Math.round(sec / 60)} min fa`;
  if (sec < 86400) return `${Math.round(sec / 3600)} h fa`;
  return `${Math.round(sec / 86400)} g fa`;
}

export default function Dashboard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [ultimoAt, setUltimoAt] = useState<string | null>(null);
  const [memoria, setMemoria] = useState(false);
  const [giri, setGiri] = useState(0);
  const [aggiornando, setAggiornando] = useState(false);
  const [metriche, setMetriche] = useState<Record<string, any> | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [diario, setDiario] = useState<DiarioVoce[]>([]);
  const [lavori, setLavori] = useState<Lavoro[]>([]);
  const [caricato, setCaricato] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  function aggiungiDiario(tipo: DiarioVoce["tipo"], titolo: string, testo: string) {
    setDiario((d) => [{ id: Date.now() + Math.random(), at: new Date().toISOString(), tipo, titolo, testo }, ...d].slice(0, 200));
    // Salva anche nel database di memoria (server-side): resta dopo il refresh e su ogni dispositivo.
    fetch("/api/diario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, titolo, testo }),
    }).catch(() => {});
  }
  function cancellaChat() {
    setMessages([]);
    try {
      localStorage.removeItem("mycity_chat");
    } catch {}
  }
  function cancellaDiario() {
    setDiario([]);
    try {
      localStorage.removeItem("mycity_diario");
    } catch {}
    // Svuota anche la copia salvata nel database, altrimenti riappare al refresh.
    fetch("/api/diario", { method: "DELETE" }).catch(() => {});
  }

  // Manda un compito al "cervello" (Claude Code sul Max): lo esegue in background
  // e il risultato compare qui sotto in "Lavori del cervello".
  async function mandaAlCervello() {
    const t = input.trim();
    if (!t) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", content: t },
      { role: "assistant", content: "🧠 Mandato al cervello (Max). Lo trovi qui sotto in «Lavori del cervello» quando è pronto." },
    ]);
    try {
      const res = await fetch("/api/lavori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ richiesta: t }),
      });
      const d = await res.json();
      if (d.ok && d.lavoro) {
        setLavori((l) => [d.lavoro, ...l]);
        aggiungiDiario("chat", "🧠 Mandato al cervello", t);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${d.error || "Non sono riuscito a creare il lavoro."}` }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ Connessione fallita." }]);
    }
  }

  function svuotaLavori() {
    setLavori([]);
    fetch("/api/lavori", { method: "DELETE" }).catch(() => {});
  }

  // Confeziona un prompt (con i dati attuali) da incollare in Claude col Max.
  // Costo API: ZERO — il lavoro pesante lo fai fare al tuo abbonamento.
  function generaPrompt(richiesta: string): string {
    const righe = metriche
      ? METRICHE.filter((x) => x.chiave && metriche[x.chiave] !== undefined && metriche[x.chiave] !== null)
          .map((x) => `- ${x.label}: ${formatta(metriche[x.chiave!], x.tipo)}`)
          .join("\n")
      : "(metriche non disponibili)";
    const brief = briefing ? `\n\n## Ultimo briefing dell'assistente\n${briefing.situazione}` : "";
    return `Sei il consulente di crescita di MyCity, il marketplace dei negozi di Piacenza.

## Dati attuali dell'azienda
${righe}${brief}

## Compito
${richiesta}

Rispondi in italiano, in modo concreto e operativo. Se ti servono dati che non vedi qui, elenca quali.`;
  }

  function dammiPrompt() {
    const t = input.trim();
    if (!t) return;
    const p = generaPrompt(t);
    setMessages((m) => [...m, { role: "user", content: t }, { role: "assistant", content: p, prompt: true }]);
    setInput("");
    aggiungiDiario("chat", "📋 Prompt per Claude Max", p);
  }

  function copia(testo: string) {
    try {
      navigator.clipboard.writeText(testo);
    } catch {}
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const caricaStato = useCallback(async () => {
    try {
      const res = await fetch("/api/stato");
      const data = await res.json();
      setMemoria(Boolean(data.memoria));
      setGiri((data.giri || []).length);
      if (data.ultimo) {
        setBriefing(data.ultimo.data);
        setUltimoAt(data.ultimo.created_at);
      }
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    caricaStato();
    fetch("/api/metriche")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.connected) setMetriche(d);
      })
      .catch(() => {});
    // Il diario salvato lato server e' la fonte durevole: se c'e', vince sul locale.
    fetch("/api/diario")
      .then((r) => r.json())
      .then((d) => {
        if (d?.memoria && Array.isArray(d.voci) && d.voci.length) {
          setDiario(
            d.voci.map((v: any) => ({ id: v.id, at: v.created_at, tipo: v.tipo, titolo: v.titolo, testo: v.testo }))
          );
        }
      })
      .catch(() => {});
  }, [caricaStato]);

  // Persistenza locale: chat, diario e briefing restano salvati e si ritrovano al refresh.
  useEffect(() => {
    try {
      const c = localStorage.getItem("mycity_chat");
      if (c) setMessages(JSON.parse(c));
      const d = localStorage.getItem("mycity_diario");
      if (d) setDiario(JSON.parse(d));
      const b = localStorage.getItem("mycity_briefing");
      if (b) {
        const o = JSON.parse(b);
        if (o.briefing) setBriefing(o.briefing);
        if (o.ultimoAt) setUltimoAt(o.ultimoAt);
      }
    } catch {}
    setCaricato(true);
  }, []);

  useEffect(() => {
    if (caricato) try { localStorage.setItem("mycity_chat", JSON.stringify(messages)); } catch {}
  }, [messages, caricato]);
  useEffect(() => {
    if (caricato) try { localStorage.setItem("mycity_diario", JSON.stringify(diario)); } catch {}
  }, [diario, caricato]);
  useEffect(() => {
    if (caricato && briefing) try { localStorage.setItem("mycity_briefing", JSON.stringify({ briefing, ultimoAt })); } catch {}
  }, [briefing, ultimoAt, caricato]);

  // Ponte col cervello (Max): controlla i lavori ogni 8s, cosi i risultati
  // del cervello compaiono qui appena pronti.
  useEffect(() => {
    let stop = false;
    const carica = async () => {
      try {
        const r = await fetch("/api/lavori");
        const d = await r.json();
        if (!stop && Array.isArray(d.lavori)) setLavori(d.lavori);
      } catch {}
    };
    carica();
    const id = setInterval(carica, 8000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  async function aggiornaOra() {
    if (aggiornando) return;
    setAggiornando(true);
    try {
      const res = await fetch("/api/heartbeat", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.briefing) {
        setBriefing(data.briefing);
        setUltimoAt(new Date().toISOString());
        const b = data.briefing;
        const op = (b.opportunita || []).map((o: any) => `• ${o.titolo}`).join("\n");
        const az = (b.azioni || []).map((a: any) => `• [${a.livello}] ${a.titolo}`).join("\n");
        aggiungiDiario("briefing", "Giro di perlustrazione", `${b.situazione}\n\nOpportunità:\n${op}\n\nAzioni proposte:\n${az}`);
      }
      caricaStato();
    } catch {
      /* errore rete */
    } finally {
      setAggiornando(false);
    }
  }

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user" as const, content: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply, tools: data.toolsUsed, esperto: data.esperto }]);
      aggiungiDiario("chat", data.esperto ? `${data.esperto.emoji} ${data.esperto.nome}` : "Assistente", `❓ ${t}\n\n${data.reply}`);
    } catch {
      setMessages([...next, { role: "assistant", content: "Connessione fallita." }]);
    } finally {
      setLoading(false);
    }
  }

  async function approva(a: Azione) {
    try {
      const res = await fetch("/api/esegui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ azione: a }),
      });
      const d = await res.json();
      if (d.collegato) {
        const esito = `${d.ok ? "✅ Eseguito" : "⚠️ Non riuscito"}: "${a.titolo}" — ${d.risultato || ""}`;
        setMessages((m) => [...m, { role: "assistant", content: esito }]);
        aggiungiDiario("azione", `Azione: ${a.titolo}`, esito);
        return;
      }
    } catch {
      /* canale non disponibile: ripiego sulla pianificazione */
    }
    // Nessun canale d'azione collegato: l'esperto spiega i passi da fare a mano.
    send(`Approvo: "${a.titolo}". Spiegami i passi concreti per realizzarla e cosa ti serve da me.`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-black/[0.06] bg-paper/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid place-items-center w-9 h-9 rounded-xl bg-brand text-white font-bold shadow-card shrink-0">
              M
            </div>
            <div className="leading-tight min-w-0">
              <h1 className="font-semibold text-[15px] tracking-tight truncate">MyCity Assistant</h1>
              <span className="text-xs text-black/40">co-pilota vivo</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${
                memoria ? "bg-green-50 text-green-700 ring-green-200" : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${memoria ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
              {memoria ? "Vivo" : "In prova"}
            </span>
            <button
              onClick={aggiornaOra}
              disabled={aggiornando}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-brand text-white rounded-full px-3.5 py-2 shadow-card hover:bg-brand-dark active:scale-[0.98] transition disabled:opacity-50"
            >
              {aggiornando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Aggiorna ora
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-6">
        {/* Battito */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-black/45">
          <Activity size={15} className={memoria ? "text-green-500" : "text-amber-500"} />
          {memoria ? (
            <span>Sistema vivo · ultimo giro {fa(ultimoAt)} · {giri} giri in memoria</span>
          ) : (
            <span>In prova · memoria non collegata (i giri non si salvano) · ultimo {fa(ultimoAt)}</span>
          )}
        </div>

        {/* Briefing autonomo */}
        <section className="bg-white rounded-2xl border border-black/[0.06] shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-50 text-brand shrink-0">
              <TrendingUp size={16} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Cosa ho scoperto e cosa propongo</span>
          </div>

          {!briefing && (
            <div className="text-center text-black/45 py-10">
              <p className="mb-4">Non ho ancora fatto un giro di perlustrazione.</p>
              <button
                onClick={aggiornaOra}
                disabled={aggiornando}
                className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-card hover:bg-brand-dark active:scale-[0.98] transition disabled:opacity-50"
              >
                {aggiornando ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Fai il primo giro
              </button>
            </div>
          )}

          {briefing && (
            <div className="space-y-5">
              <p className="text-sm text-ink/90 leading-relaxed whitespace-pre-wrap">{briefing.situazione}</p>

              {briefing.opportunita?.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-black/40 mb-2">Opportunità</div>
                  <div className="space-y-2">
                    {briefing.opportunita.map((o, i) => (
                      <div key={i} className="rounded-xl border border-black/[0.07] bg-paper/40 p-3.5 hover:border-brand/30 hover:bg-brand-50/40 transition">
                        <div className="text-sm font-medium">{o.titolo}</div>
                        <div className="text-sm text-black/60 mt-0.5">{o.motivo}</div>
                        <div className="text-xs text-black/40 mt-2 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-black/5">impatto {o.impatto}</span>
                          <span className="px-1.5 py-0.5 rounded bg-black/5">sforzo {o.sforzo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {briefing.azioni?.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-black/40 mb-2">
                    Azioni proposte (servono la tua conferma)
                  </div>
                  <div className="space-y-2">
                    {briefing.azioni.map((a, i) => (
                      <div key={i} className={`border rounded-xl p-3.5 ${COLORI[a.livello] || ""}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold">{a.titolo}</div>
                            <div className="text-sm opacity-80 mt-0.5">{a.motivo}</div>
                          </div>
                          <button
                            onClick={() => approva(a)}
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium bg-white/80 border border-black/10 rounded-full px-3 py-1.5 shadow-sm hover:bg-white active:scale-95 transition"
                          >
                            <CheckCircle2 size={13} /> Approva
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Metriche (a sinistra) + Chat */}
        <div className="grid lg:grid-cols-5 gap-5">
          <aside className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-50 text-brand shrink-0">
                <BarChart3 size={16} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">Cockpit</span>
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              {METRICHE.map((m) => (
                <Card
                  key={m.label}
                  icon={m.icon}
                  label={m.label}
                  value={m.chiave && metriche ? formatta(metriche[m.chiave], m.tipo) : "—"}
                  fonte={m.fonte}
                />
              ))}
            </div>
          </aside>

          {/* Chat */}
          <section className="lg:col-span-3 flex flex-col bg-white rounded-2xl border border-black/[0.06] shadow-card overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-black/[0.05]">
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-50 text-brand shrink-0">
                <Send size={15} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">Parla con l'assistente</span>
            </div>
            {messages.length > 0 && (
              <button onClick={cancellaChat} className="text-xs text-black/40 hover:text-black/70 inline-flex items-center gap-1 transition">
                <Trash2 size={12} /> Svuota chat
              </button>
            )}
          </div>
          <div className="scroll-soft flex-1 p-5 space-y-4 overflow-y-auto min-h-[220px] max-h-[440px]">
            {messages.length === 0 && (
              <div className="pt-1">
                <p className="text-sm text-black/50 mb-3">
                  Scrivi un obiettivo o una domanda: l'AD la assegna all'esperto giusto del team.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEAM.map((e) => (
                    <div key={e.nome} className="flex items-start gap-2.5 text-xs border border-black/[0.07] bg-paper/40 rounded-xl px-3 py-2 hover:border-brand/30 hover:bg-brand-50/40 transition">
                      <span className="text-base leading-none mt-0.5">{e.emoji}</span>
                      <span className="leading-snug">
                        <span className="font-semibold text-ink/80">{e.nome}</span>
                        <br />
                        <span className="text-black/40">{e.ruolo}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) =>
              m.prompt ? (
                <div key={i} className="text-left">
                  <div className="text-xs text-black/45 mb-1.5 flex items-center gap-1">
                    <FileText size={12} className="text-brand" /> Prompt pronto — incollalo in Claude (claude.ai) col tuo Max: gratis
                  </div>
                  <div className="border border-brand/25 bg-brand-50/60 rounded-xl p-3.5">
                    <pre className="text-xs whitespace-pre-wrap font-sans text-ink/90 leading-relaxed">{m.content}</pre>
                    <button
                      onClick={() => copia(m.content)}
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium bg-brand text-white rounded-full px-3 py-1.5 hover:bg-brand-dark active:scale-95 transition"
                    >
                      <Copy size={12} /> Copia
                    </button>
                  </div>
                </div>
              ) : (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  {m.role === "assistant" && m.esperto && (
                    <div className="text-xs text-black/45 mb-1">
                      {m.esperto.emoji} {m.esperto.nome}
                    </div>
                  )}
                  <span
                    className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap max-w-[85%] leading-relaxed ${
                      m.role === "user"
                        ? "bg-brand text-white rounded-br-md shadow-card"
                        : "bg-black/[0.04] text-ink rounded-bl-md"
                    }`}
                  >
                    {m.content}
                  </span>
                  {m.role === "assistant" && m.tools && m.tools.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-black/35 mt-1.5">
                      <Wrench size={12} />
                      {m.tools.map((t) => TOOL_LABELS[t] || t).join(" · ")}
                    </div>
                  )}
                </div>
              )
            )}
            {loading && (
              <div className="flex items-center gap-2 text-black/40 text-sm">
                <Loader2 size={16} className="animate-spin" /> Sto lavorando...
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-black/[0.06] p-3 space-y-2 bg-paper/30">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Chiedi qualcosa o dai un obiettivo..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/[0.04] border border-transparent outline-none text-sm transition focus:bg-white focus:border-brand/30 focus:ring-2 focus:ring-brand/15"
              />
              <button
                onClick={() => send()}
                disabled={loading}
                className="bg-brand text-white px-4 rounded-xl hover:bg-brand-dark active:scale-95 transition disabled:opacity-40 disabled:active:scale-100"
                aria-label="Invia"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={dammiPrompt}
                disabled={!input.trim()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 border border-brand/40 text-brand px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-brand-50 active:scale-95 transition disabled:opacity-40 disabled:active:scale-100"
                title="Crea un prompt pronto da incollare in Claude col tuo Max (gratis)"
              >
                <FileText size={14} /> Prompt (copia per Max)
              </button>
              <button
                onClick={mandaAlCervello}
                disabled={!input.trim()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 border border-brand/40 text-brand px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-brand-50 active:scale-95 transition disabled:opacity-40 disabled:active:scale-100"
                title="Manda il compito al cervello (Claude Code sul Max): pesante, gratis, in background"
              >
                <Brain size={14} /> Manda al cervello (Max)
              </button>
            </div>
            <p className="text-[11px] text-black/40 px-1 leading-relaxed">
              💬 <b>Invia</b> = subito (API, a pagamento) · 📋 <b>Prompt</b> = lo copi nel Max · 🧠 <b>Cervello</b> = lo fa il Max in automatico
            </p>
          </div>
          </section>
        </div>

        {/* Lavori del cervello: ponte con Claude Code sul Max */}
        <section className="bg-white rounded-2xl border border-black/[0.06] shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-50 text-brand shrink-0">
                <Brain size={16} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">Lavori del cervello (Max)</span>
            </div>
            {lavori.length > 0 && (
              <button onClick={svuotaLavori} className="text-xs text-black/40 hover:text-black/70 inline-flex items-center gap-1 transition">
                <Trash2 size={12} /> Svuota
              </button>
            )}
          </div>
          <p className="text-[11px] text-black/40 mb-3">
            Compiti pesanti che esegue il cervello su Claude Code/Max, gratis. Se il cervello non è ancora acceso, restano «in attesa».
          </p>
          {lavori.length === 0 ? (
            <p className="text-sm text-black/40">
              Nessun lavoro. Scrivi un compito nella chat e premi «🧠 Manda al cervello».
            </p>
          ) : (
            <div className="scroll-soft space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {lavori.map((lv) => (
                <div key={lv.id} className="border border-black/[0.07] rounded-xl p-3.5">
                  <div className="flex items-center gap-2 text-xs mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full ring-1 font-medium ${LAVORO_STATO[lv.stato]?.cls || "bg-black/5 ring-black/10 text-black/60"}`}>
                      {LAVORO_STATO[lv.stato]?.label || lv.stato}
                    </span>
                    {lv.esperto && <span className="text-black/45">{lv.esperto}</span>}
                    <span className="ml-auto text-black/40 shrink-0">{fa(lv.updated_at || lv.created_at)}</span>
                  </div>
                  <div className="text-sm font-medium text-ink/85">{lv.richiesta}</div>
                  {lv.risultato && (
                    <div className="mt-2 text-sm text-ink/85 whitespace-pre-wrap border-t border-black/[0.06] pt-2">{lv.risultato}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Diario: tutto cio' che l'assistente dice e fa, salvato */}
        <section className="bg-white rounded-2xl border border-black/[0.06] shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-50 text-brand shrink-0">
                <History size={16} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">Diario — tutto ciò che dice e fa</span>
            </div>
            {diario.length > 0 && (
              <button onClick={cancellaDiario} className="text-xs text-black/40 hover:text-black/70 inline-flex items-center gap-1 transition">
                <Trash2 size={12} /> Svuota
              </button>
            )}
          </div>
          <p className="text-[11px] text-black/40 mb-3">
            {memoria
              ? "💾 Salvato nel database: resta anche se aggiorni la pagina o cambi dispositivo."
              : "💾 Salvato su questo browser. Collega il database di memoria per ritrovarlo ovunque."}
          </p>
          {diario.length === 0 ? (
            <p className="text-sm text-black/40">
              Ancora niente. Qui resta salvato ogni messaggio della chat, ogni giro e ogni azione.
            </p>
          ) : (
            <div className="scroll-soft space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {diario.map((v) => (
                <div key={v.id} className="border border-black/[0.07] rounded-xl p-3.5 hover:border-black/10 hover:bg-paper/40 transition">
                  <div className="flex items-center gap-2 text-xs text-black/40 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand font-medium shrink-0">{DIARIO_TIPO[v.tipo] || v.tipo}</span>
                    <span className="font-medium text-ink/70 truncate">{v.titolo}</span>
                    <span className="ml-auto shrink-0">{fa(v.at)}</span>
                  </div>
                  <div className="text-sm text-ink/85 whitespace-pre-wrap leading-relaxed">{v.testo}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  fonte,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  fonte: string;
}) {
  const connesso = value !== "—";
  return (
    <div
      className={`rounded-2xl border p-3.5 transition ${
        connesso
          ? "bg-white border-black/[0.06] shadow-card hover:shadow-hover hover:-translate-y-0.5"
          : "bg-black/[0.015] border-dashed border-black/[0.12]"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`grid place-items-center w-7 h-7 rounded-lg shrink-0 ${
            connesso ? "bg-brand-50 text-brand" : "bg-black/[0.04] text-black/30"
          }`}
        >
          {icon}
        </span>
        <span className="text-xs text-black/50 leading-tight">{label}</span>
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${connesso ? "text-ink" : "text-black/25"}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-black/30 mt-1">
        {connesso ? fonte : `da collegare · ${fonte}`}
      </div>
    </div>
  );
}
