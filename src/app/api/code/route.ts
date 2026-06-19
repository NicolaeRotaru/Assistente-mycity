import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { listRepoFiles } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM = `Sei "Claude Code", lo sviluppatore di MyCity (marketplace dei negozi di Piacenza).
Stack del progetto: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS.
Ricevi la richiesta dell'utente e il progetto preparato da "Claude Design".
Devi produrre le modifiche di codice necessarie chiamando lo strumento "emit_changes".

Regole:
- Per ogni file che crei o modifichi, fornisci il contenuto COMPLETO del file (non frammenti, non diff).
- Rispetta le convenzioni del progetto (Tailwind con colori brand/ink/paper, alias "@/..." per src).
- Mantieni le modifiche minime e coerenti con il progetto.
- "branch", "prTitle", "prBody" e "summary" in italiano. "summary" e "prBody" in Markdown.`;

const TOOL: Anthropic.Tool = {
  name: "emit_changes",
  description:
    "Restituisce le modifiche di codice da applicare e i metadati per aprire la Pull Request.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "Riassunto in italiano (Markdown) di cosa e' stato fatto.",
      },
      branch: {
        type: "string",
        description: "Slug breve in kebab-case per il branch, es. 'fix-carrello'.",
      },
      prTitle: { type: "string", description: "Titolo della Pull Request." },
      prBody: {
        type: "string",
        description: "Descrizione della Pull Request in Markdown.",
      },
      files: {
        type: "array",
        description: "File da creare o modificare, con contenuto completo.",
        items: {
          type: "object",
          properties: {
            path: { type: "string", description: "Percorso dalla root, es. 'src/app/page.tsx'." },
            content: { type: "string", description: "Contenuto COMPLETO del file." },
          },
          required: ["path", "content"],
        },
      },
    },
    required: ["summary", "branch", "prTitle", "prBody", "files"],
  },
};

export async function POST(req: NextRequest) {
  try {
    const { instruction, design } = await req.json();
    if (!instruction || !design) {
      return NextResponse.json(
        { error: "Servono sia la richiesta sia il progetto." },
        { status: 400 }
      );
    }

    const repoFiles = await listRepoFiles();
    const contesto = repoFiles.length
      ? `\n\nFile attualmente presenti nel repo:\n${repoFiles.join("\n")}`
      : "";

    const anthropic = getAnthropic();
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "emit_changes" },
      messages: [
        {
          role: "user",
          content: `Richiesta dell'utente:\n${instruction}\n\nProgetto di Claude Design:\n${design}${contesto}`,
        },
      ],
    });

    const block = res.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!block) {
      return NextResponse.json(
        { error: "Claude Code non ha prodotto modifiche strutturate." },
        { status: 502 }
      );
    }

    return NextResponse.json(block.input);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
