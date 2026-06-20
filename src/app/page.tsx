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
type Msg = { role: "user" | "assistant"; content: string; tools?: string[] };

const TOOL_LABELS: Record<string, string> = {
  web_search: "Ricerca web",
  marketplace_elenco_file: "Elenco file del sito",
  marketplace_leggi_file: "Lettura file del sito",
};
const COLORI: Record<Livello, string> = {
  verde: "border-green-300 bg-green-50 text-green-800",
  giallo: "border-amber-300 bg-amber-50 text-amber-800",
  rosso: "border-red-300 bg-red-50 text-red-800",
};

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

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

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
  }, [caricaStato]);

  async function aggiornaOra() {
    if (aggiornando) return;
    setAggiornando(true);
    try {
      const res = await fetch("/api/heartbeat", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.briefing) {
        setBriefing(data.briefing);
        setUltimoAt(new Date().toISOString());
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
      setMessages([...next, { role: "assistant", content: data.reply, tools: data.toolsUsed }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Connessione fallita." }]);
    } finally {
      setLoading(false);
    }
  }

  function approva(a: Azione) {
    send(`Approvo: "${a.titolo}". Spiegami i passi concreti per realizzarla e cosa ti serve da me.`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black/10 bg-white">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${memoria ? "bg-green-500" : "bg-amber-400"}`} />
          <h1 className="font-semibold text-lg">MyCity Assistant</h1>
          <span className="text-sm text-black/40">· co-pilota vivo</span>
          <button
            onClick={aggiornaOra}
            disabled={aggiornando}
            className="ml-auto inline-flex items-center gap-1.5 text-sm bg-brand text-white rounded-full px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
          >
            {aggiornando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Aggiorna ora
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-6 space-y-5">
        {/* Battito */}
        <div className="flex items-center gap-2 text-sm text-black/50">
          <Activity size={16} className={memoria ? "text-green-500" : "text-amber-500"} />
          {memoria ? (
            <span>Vivo · ultimo giro {fa(ultimoAt)} · {giri} giri in memoria</span>
          ) : (
            <span>In prova · memoria non collegata (i giri non si salvano) · ultimo {fa(ultimoAt)}</span>
          )}
        </div>

        {/* Briefing autonomo */}
        <section className="bg-white rounded-xl border border-black/10 p-5">
          <div className="flex items-center gap-2 text-black/60 text-sm font-medium mb-3">
            <TrendingUp size={16} className="text-brand" /> Cosa ho scoperto e cosa propongo
          </div>

          {!briefing && (
            <div className="text-center text-black/45 py-8">
              <p className="mb-3">Non ho ancora fatto un giro.</p>
              <button
                onClick={aggiornaOra}
                disabled={aggiornando}
                className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
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
                      <div key={i} className="border border-black/10 rounded-lg p-3">
                        <div className="text-sm font-medium">{o.titolo}</div>
                        <div className="text-sm text-black/60">{o.motivo}</div>
                        <div className="text-xs text-black/40 mt-1">
                          impatto {o.impatto} · sforzo {o.sforzo}
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
                      <div key={i} className={`border rounded-lg p-3 ${COLORI[a.livello] || ""}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{a.titolo}</div>
                            <div className="text-sm opacity-80">{a.motivo}</div>
                          </div>
                          <button
                            onClick={() => approva(a)}
                            className="shrink-0 inline-flex items-center gap-1 text-xs bg-white/70 border border-black/15 rounded-full px-2.5 py-1 hover:bg-white"
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

        {/* Chat */}
        <section className="flex flex-col bg-white rounded-xl border border-black/10 overflow-hidden">
          <div className="px-5 pt-4 text-black/60 text-sm font-medium">Parla con l'assistente</div>
          <div className="flex-1 p-5 space-y-4 overflow-y-auto min-h-[200px] max-h-[420px]">
            {messages.length === 0 && (
              <p className="text-center text-black/40 text-sm pt-6">
                Approva un'azione qui sopra, o scrivi un obiettivo.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap max-w-[85%] ${
                    m.role === "user" ? "bg-brand text-white rounded-br-sm" : "bg-black/5 text-ink rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </span>
                {m.role === "assistant" && m.tools && m.tools.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-black/35 mt-1">
                    <Wrench size={12} />
                    {m.tools.map((t) => TOOL_LABELS[t] || t).join(" · ")}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-black/40 text-sm">
                <Loader2 size={16} className="animate-spin" /> Sto lavorando...
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-black/10 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Chiedi qualcosa o dai un obiettivo..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-black/5 outline-none text-sm focus:ring-2 focus:ring-brand/30"
            />
            <button
              onClick={() => send()}
              disabled={loading}
              className="bg-brand text-white px-4 rounded-lg hover:opacity-90 disabled:opacity-40"
              aria-label="Invia"
            >
              <Send size={18} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
