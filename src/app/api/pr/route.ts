import { NextRequest, NextResponse } from "next/server";
import { createPullRequest, type ChangedFile } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { branch, prTitle, prBody, files } = await req.json();

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "Nessun file da inviare." }, { status: 400 });
    }
    const cleanFiles: ChangedFile[] = files
      .filter((f: any) => f && typeof f.path === "string" && typeof f.content === "string")
      .map((f: any) => ({ path: f.path, content: f.content }));

    if (!cleanFiles.length) {
      return NextResponse.json({ error: "File non validi." }, { status: 400 });
    }

    const pr = await createPullRequest({
      branch: branch || "assistant-change",
      title: prTitle || "Modifica da MyCity Assistant",
      body: prBody || "Generata automaticamente da MyCity Assistant.",
      files: cleanFiles,
    });

    return NextResponse.json(pr);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
