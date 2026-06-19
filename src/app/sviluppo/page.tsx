"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wand2,
  Code2,
  GitPullRequest,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

type ChangedFile = { path: string; content: string };
type CodeResult = {
  summary: string;
  branch: string;
  prTitle: string;
  prBody: string;
  files: ChangedFile[];
};
type PrResult = { url: string; number: number; branch: string };

type Step =
  | "idle"
  | "designing"
  | "design"
  | "coding"
  | "code"
  | "creating"
  | "done";

export default function Sviluppo() {
  const [step, setStep] = useState<Step>("idle");
  const [instruction, setInstruction] = useState("");
  const [design, setDesign] = useState("");
  const [code, setCode] = useState<CodeResult | null>(null);
  const [pr, setPr] = useState<PrResult | null>(null);
  const [error, setError] = useState("");

  const busy = step === "designing" || step === "coding" || step === "creating";

  async function call<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore sconosciuto.");
    return data as T;
  }

  async function runDesign() {
    const text = instruction.trim();
    if (!text || busy) return;
    setError("");
    setCode(null);
    setPr(null);
    setStep("designing");
    try {
      const data = await call<{ design: string }>("/api/design", { instruction: text });
      setDesign(data.design);
      setStep("design");
    } catch (e: any) {
      setError(e.message);
      setStep("idle");
    }
  }

  async function runCode() {
    if (busy) return;
    setError("");
    setStep("coding");
    try {
      const data = await call<CodeResult>("/api/code", { instruction, design });
      setCode(data);
      setStep("code");
    } catch (e: any) {
      setError(e.message);
      setStep("design");
    }
  }

  async function createPr() {
    if (busy || !code) return;
    setError("");
    setStep("creating");
    try {
      const data = await call<PrResult>("/api/pr", {
        branch: code.branch,
        prTitle: code.prTitle,
        prBody: code.prBody,
        files: code.files,
      });
      setPr(data);
      setStep("done");
    } catch (e: any) {
      setError(e.message);
      setStep("code");
    }
  }

  function reset() {
    setStep("idle");
    setInstruction("");
    setDesign("");
    setCode(null);
    setPr(null);
    setError("");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black/10 bg-white">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/" className="text-black/40 hover:text-black/70" aria-label="Indietro">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-semibold text-lg">Sviluppo</h1>
          <span className="ml-auto text-sm text-black/40">Design → Code → Pull Request</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-6 space-y-5">
        {/* Step 1: la richiesta */}
        <section className="bg-white rounded-xl border border-black/10 p-5">
          <label className="text-sm text-black/50 mb-2 block">
            Cosa vuoi che venga fatto? (in italiano)
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={step !== "idle" && step !== "designing"}
            rows={3}
            placeholder="Es: aggiungi un pulsante 'Esci' nell'header del sito"
            className="w-full px-4 py-3 rounded-lg bg-black/5 outline-none text-sm focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
          />
          {(step === "idle" || step === "designing") && (
            <button
              onClick={runDesign}
              disabled={busy || !instruction.trim()}
              className="mt-3 inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-40"
            >
              {step === "designing" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Wand2 size={16} />
              )}
              Chiedi a Claude Design
            </button>
          )}
        </section>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg p-4 text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span className="whitespace-pre-wrap">{error}</span>
          </div>
        )}

        {/* Step 2: il progetto di Claude Design */}
        {(step === "design" || step === "coding" || step === "code" || step === "creating" || step === "done") && (
          <section className="bg-white rounded-xl border border-black/10 p-5">
            <div className="flex items-center gap-2 text-black/60 text-sm font-medium mb-3">
              <Wand2 size={16} className="text-brand" /> Claude Design — il progetto
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-ink/90 leading-relaxed">
              {design}
            </pre>
            {step === "design" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={runCode}
                  className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm hover:opacity-90"
                >
                  <Code2 size={16} /> Approva → Claude Code scrive il codice
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 rounded-lg text-sm border border-black/15 hover:bg-black/5"
                >
                  Ricomincia
                </button>
              </div>
            )}
            {step === "coding" && (
              <div className="mt-4 flex items-center gap-2 text-black/40 text-sm">
                <Loader2 size={16} className="animate-spin" /> Claude Code sta scrivendo il codice...
              </div>
            )}
          </section>
        )}

        {/* Step 3: il codice di Claude Code */}
        {code && (step === "code" || step === "creating" || step === "done") && (
          <section className="bg-white rounded-xl border border-black/10 p-5">
            <div className="flex items-center gap-2 text-black/60 text-sm font-medium mb-3">
              <Code2 size={16} className="text-brand" /> Claude Code — le modifiche proposte
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-ink/90 leading-relaxed mb-3">
              {code.summary}
            </pre>

            <div className="text-xs text-black/40 mb-1">Titolo PR</div>
            <div className="text-sm font-medium mb-3">{code.prTitle}</div>

            <div className="text-xs text-black/40 mb-2">
              File ({code.files.length})
            </div>
            <div className="space-y-2">
              {code.files.map((f) => (
                <FileBlock key={f.path} file={f} />
              ))}
            </div>

            {step === "code" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={createPr}
                  className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm hover:opacity-90"
                >
                  <GitPullRequest size={16} /> Crea la Pull Request su GitHub
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 rounded-lg text-sm border border-black/15 hover:bg-black/5"
                >
                  Annulla
                </button>
              </div>
            )}
            {step === "creating" && (
              <div className="mt-4 flex items-center gap-2 text-black/40 text-sm">
                <Loader2 size={16} className="animate-spin" /> Apro la Pull Request su GitHub...
              </div>
            )}
          </section>
        )}

        {/* Step 4: PR creata */}
        {pr && step === "done" && (
          <section className="bg-white rounded-xl border border-green-200 p-5">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <CheckCircle2 size={18} /> Pull Request #{pr.number} creata
            </div>
            <p className="text-sm text-black/60 mb-3">
              Branch <code className="bg-black/5 px-1.5 py-0.5 rounded">{pr.branch}</code>.
              Aprila su GitHub per rivederla e farne il merge.
            </p>
            <div className="flex gap-2">
              <a
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm hover:opacity-90"
              >
                <GitPullRequest size={16} /> Apri la Pull Request
              </a>
              <button
                onClick={reset}
                className="px-4 py-2.5 rounded-lg text-sm border border-black/15 hover:bg-black/5"
              >
                Nuova richiesta
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function FileBlock({ file }: { file: ChangedFile }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-black/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5"
      >
        <ChevronDown
          size={15}
          className={`transition-transform ${open ? "" : "-rotate-90"}`}
        />
        <code className="text-ink">{file.path}</code>
      </button>
      {open && (
        <pre className="text-xs bg-ink/95 text-paper p-3 overflow-x-auto leading-relaxed">
          {file.content}
        </pre>
      )}
    </div>
  );
}
