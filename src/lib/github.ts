export type ChangedFile = { path: string; content: string };

const API = "https://api.github.com";

type RepoConfig = {
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
};

function getConfig(): RepoConfig {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const baseBranch = process.env.GITHUB_DEFAULT_BRANCH || "main";

  if (!token || !owner || !repo) {
    throw new Error(
      "Config GitHub mancante. Servono GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO nelle variabili d'ambiente."
    );
  }
  return { token, owner, repo, baseBranch };
}

async function gh<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mycity-assistant",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}: ${data.message || "errore"}`);
  }
  return data as T;
}

/**
 * Restituisce l'elenco dei percorsi dei file del repo (per dare contesto a Claude Code).
 * Best-effort: se la config GitHub manca o l'API fallisce, torna una lista vuota.
 */
export async function listRepoFiles(): Promise<string[]> {
  let cfg: RepoConfig;
  try {
    cfg = getConfig();
  } catch {
    return [];
  }
  const { token, owner, repo, baseBranch } = cfg;
  try {
    const ref = await gh<{ object: { sha: string } }>(
      token,
      `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`
    );
    const commit = await gh<{ tree: { sha: string } }>(
      token,
      `/repos/${owner}/${repo}/git/commits/${ref.object.sha}`
    );
    const tree = await gh<{ tree: { path: string; type: string }[] }>(
      token,
      `/repos/${owner}/${repo}/git/trees/${commit.tree.sha}?recursive=1`
    );
    return tree.tree.filter((t) => t.type === "blob" && t.path).map((t) => t.path);
  } catch {
    return [];
  }
}

/**
 * Crea un branch nuovo con i file indicati e apre una Pull Request verso il branch base.
 * Commit multi-file atomico tramite la Git Data API di GitHub.
 */
export async function createPullRequest(params: {
  branch: string;
  title: string;
  body: string;
  files: ChangedFile[];
}): Promise<{ url: string; number: number; branch: string }> {
  const { token, owner, repo, baseBranch } = getConfig();
  const base = `/repos/${owner}/${repo}`;

  if (!params.files.length) {
    throw new Error("Nessun file da modificare: Claude Code non ha prodotto cambiamenti.");
  }

  // 1) Punto di partenza: ultimo commit del branch base.
  const ref = await gh<{ object: { sha: string } }>(
    token,
    `${base}/git/ref/heads/${baseBranch}`
  );
  const baseSha = ref.object.sha;
  const baseCommit = await gh<{ tree: { sha: string } }>(
    token,
    `${base}/git/commits/${baseSha}`
  );

  // 2) Nome branch univoco (evita collisioni se ripeti la stessa richiesta).
  const slug =
    (params.branch || "assistant-change")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "assistant-change";
  const branch = `mycity/${slug}-${Date.now().toString(36)}`;

  // 3) Albero con i file nuovi/modificati, basato sull'albero del commit base.
  const tree = await gh<{ sha: string }>(token, `${base}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: params.files.map((f) => ({
        path: f.path,
        mode: "100644",
        type: "blob",
        content: f.content,
      })),
    }),
  });

  // 4) Commit con quell'albero.
  const commit = await gh<{ sha: string }>(token, `${base}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: params.title,
      tree: tree.sha,
      parents: [baseSha],
    }),
  });

  // 5) Crea il branch puntando al nuovo commit.
  await gh(token, `${base}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
  });

  // 6) Apre la Pull Request.
  const pr = await gh<{ html_url: string; number: number }>(token, `${base}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: params.title,
      head: branch,
      base: baseBranch,
      body: params.body,
    }),
  });

  return { url: pr.html_url, number: pr.number, branch };
}
