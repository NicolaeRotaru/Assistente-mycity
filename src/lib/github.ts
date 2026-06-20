// Lettura SOLA-LETTURA del repo del marketplace (mycity).
// Nessuna scrittura: l'assistente puo' analizzare il codice, non modificarlo.

const API = "https://api.github.com";

type RepoConfig = { token: string; owner: string; repo: string; branch: string };

function getConfig(): RepoConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_DEFAULT_BRANCH || "main";
  if (!token || !owner || !repo) return null;
  return { token, owner, repo, branch };
}

export function isMarketplaceConnected(): boolean {
  return getConfig() !== null;
}

async function gh<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mycity-assistant",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${data.message || "errore"}`);
  return data as T;
}

const NOT_CONNECTED =
  "GitHub non collegato. Per analizzare il marketplace servono GITHUB_TOKEN (sola lettura), GITHUB_OWNER e GITHUB_REPO nelle variabili d'ambiente.";

/** Elenco dei file del marketplace (percorsi). */
export async function listMarketplaceFiles(): Promise<string> {
  const cfg = getConfig();
  if (!cfg) return NOT_CONNECTED;
  try {
    const ref = await gh<{ object: { sha: string } }>(
      cfg.token,
      `/repos/${cfg.owner}/${cfg.repo}/git/ref/heads/${cfg.branch}`
    );
    const commit = await gh<{ tree: { sha: string } }>(
      cfg.token,
      `/repos/${cfg.owner}/${cfg.repo}/git/commits/${ref.object.sha}`
    );
    const tree = await gh<{ tree: { path: string; type: string }[] }>(
      cfg.token,
      `/repos/${cfg.owner}/${cfg.repo}/git/trees/${commit.tree.sha}?recursive=1`
    );
    const files = tree.tree
      .filter((t) => t.type === "blob" && t.path)
      .map((t) => t.path);
    return files.length
      ? `File nel marketplace (${files.length}):\n${files.join("\n")}`
      : "Il repo del marketplace risulta vuoto.";
  } catch (e: any) {
    return `Errore leggendo il marketplace: ${e.message}`;
  }
}

/** Contenuto di un file del marketplace. */
export async function readMarketplaceFile(path: string): Promise<string> {
  const cfg = getConfig();
  if (!cfg) return NOT_CONNECTED;
  if (!path) return "Indica il percorso del file da leggere.";
  try {
    const file = await gh<{ content?: string; encoding?: string; message?: string }>(
      cfg.token,
      `/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(path)}?ref=${cfg.branch}`
    );
    if (!file.content) return `File non trovato: ${path}`;
    const text = Buffer.from(file.content, "base64").toString("utf-8");
    // Evita risposte enormi: taglia file molto grandi.
    const max = 12000;
    return text.length > max
      ? text.slice(0, max) + `\n\n[...troncato, file lungo ${text.length} caratteri]`
      : text;
  } catch (e: any) {
    return `Errore leggendo ${path}: ${e.message}`;
  }
}
