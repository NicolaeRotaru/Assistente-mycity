# MyCity Assistant — versione minima (solo AI)

Versione ridotta per **testare solo la chat AI**.
Niente Supabase, niente Stripe: serve una sola chiave.

## Cosa fa adesso
- Chat AI in italiano (modello Claude Sonnet)
- Dashboard con la chat e alcune metriche segnaposto
- **Pagina /sviluppo**: scrivi una richiesta → **Claude Design** prepara il progetto
  → (tu approvi) → **Claude Code** scrive il codice → (tu approvi) → si apre una
  **Pull Request su GitHub**. Ogni passo passa dalla tua conferma.

## La pagina /sviluppo (Design → Code → PR)
1. Scrivi cosa vuoi fare (es: "aggiungi un pulsante Esci nell'header").
2. Claude Design ti mostra il progetto. Lo approvi.
3. Claude Code ti mostra i file modificati (contenuto completo). Li approvi.
4. Viene aperta una Pull Request sul repo del marketplace: la rivedi e fai il merge su GitHub.

**Su quale repo apre le PR?** Su quello indicato da `GITHUB_OWNER`/`GITHUB_REPO`.
Di default punta al **marketplace `mycity`** (il sito vero), così le modifiche che
chiedi finiscono lì e non su questo assistente. Per cambiare bersaglio, modifica
`GITHUB_REPO`.

Serve un **token GitHub** (vedi `.env.example`: `GITHUB_TOKEN`, `GITHUB_OWNER`,
`GITHUB_REPO`) con accesso in scrittura al repo di destinazione (*Contents* e
*Pull requests*).

## Avvio in locale (3 passi)
1. `npm install`
2. Copia `.env.example` in `.env.local` e inserisci la tua `ANTHROPIC_API_KEY`
3. `npm run dev` → apri http://localhost:3000

## Online (Vercel)
Il repo e collegato a Vercel: ogni push su `main` pubblica il sito.
Per far funzionare la chat:
1. Vercel → Project → Settings → Environment Variables
2. Aggiungi `ANTHROPIC_API_KEY` = la tua chiave
3. Fai **Redeploy**

## Riaggiungere Supabase e Stripe in futuro
Erano in `src/lib/` (supabase.ts, stripe.ts, tools.ts, runTool.ts) e
collegati nella route `src/app/api/chat/route.ts`. Sono stati rimossi
per testare l'AI in isolamento.
