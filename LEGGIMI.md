# MyCity Assistant — versione minima (solo AI)

Versione ridotta per **testare solo la chat AI**.
Niente Supabase, niente Stripe: serve una sola chiave.

## Cosa fa adesso (base "viva")
L'assistente non aspetta che gli scrivi: **lavora da solo**.
- ⏰ **Battito autonomo:** ogni ora (cron) fa un *giro di perlustrazione* —
  cerca sul web (concorrenti, trend, idee) e può analizzare il sito `mycity`
  (sola lettura) — poi ragiona e prepara un **briefing** con opportunità e
  **azioni proposte** (🟢 fa da solo · 🟡 ti avvisa · 🔴 serve la tua firma).
- 🧠 **Memoria:** salva ogni giro, così ritrovi cosa ha scoperto mentre eri via.
- ✅ **Tu approvi:** propone, non decide. Approvi le azioni dalla dashboard.
- 💬 **Chat con strumenti:** puoi sempre chiedergli qualcosa; usa ricerca web e
  analisi del sito.

Il piano completo e le regole sono in `PIANO.md` e `ARCHITETTURA.md`.

## Per renderlo davvero "vivo"
1. **Memoria (Supabase):** crea un progetto su supabase.com, poi una tabella:
   ```sql
   create table briefings (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     data jsonb not null
   );
   ```
   Metti `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` nelle variabili d'ambiente.
2. **Sveglia (cron):** è già in `vercel.json` (ogni ora). Imposta `CRON_SECRET`
   su Vercel così solo il cron può attivarlo. *(Nota: il piano gratuito di
   Vercel limita la frequenza dei cron — eventualmente passa a giornaliero.)*
3. Senza memoria/cron funziona comunque: premi **"Aggiorna ora"** per un giro.

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
