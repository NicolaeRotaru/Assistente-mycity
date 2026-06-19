"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Store, Package, Bell, Euro, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Dashboard() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
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
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Connessione fallita. Controlla che il server sia avviato." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggerimenti = [
    "Quanti ordini abbiamo avuto oggi?",
    "Ci sono notifiche di problemi?",
    "Quanto abbiamo incassato questa settimana?",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-black/10 bg-white">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand" />
          <h1 className="font-semibold text-lg">MyCity Assistant</h1>
          <span className="ml-auto text-sm text-black/40">Piacenza</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-6 grid lg:grid-cols-3 gap-6">
        {/* Colonna sinistra: metriche e notifiche */}
        <aside className="space-y-4">
          <Card icon={<Package size={18} />} label="Ordini oggi" value="—" hint="Presto disponibile" />
          <Card icon={<Euro size={18} />} label="Incasso 7 giorni" value="—" hint="Presto disponibile" />
          <Card icon={<Bell size={18} />} label="Notifiche aperte" value="—" hint="Problemi rider, segnalazioni" />
          <Card icon={<Store size={18} />} label="Negozi attivi" value="—" hint="Commercianti su MyCity" />
        </aside>

        {/* Colonna destra: la chat AI */}
        <section className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-black/10 overflow-hidden">
          <div className="flex-1 p-5 space-y-4 overflow-y-auto min-h-[420px] max-h-[520px]">
            {messages.length === 0 && (
              <div className="text-center text-black/50 pt-10">
                <p className="mb-4">Chiedi qualcosa per iniziare</p>
                <div className="flex flex-col gap-2 items-center">
                  {suggerimenti.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-sm text-brand border border-brand/30 rounded-full px-4 py-1.5 hover:bg-brand/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap max-w-[85%] ${
                    m.role === "user"
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-black/5 text-ink rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-black/40 text-sm">
                <Loader2 size={16} className="animate-spin" /> Sto pensando...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-black/10 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Scrivi un comando..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-black/5 outline-none text-sm focus:ring-2 focus:ring-brand/30"
            />
            <button
              onClick={send}
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

function Card({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-black/10 p-4">
      <div className="flex items-center gap-2 text-black/50 text-sm mb-1">
        {icon} {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-black/35 mt-1">{hint}</div>
    </div>
  );
}
