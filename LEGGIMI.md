# MyCity Assistant — versione minima (solo AI)

Versione ridotta per **testare solo la chat AI**.
Niente Supabase, niente Stripe: serve una sola chiave.

## Cosa fa adesso (v1 — co-pilota con strumenti)
- Chat AI in italiano (Claude) che **usa strumenti**, non solo chiacchiera:
  - 🔎 **ricerca sul web** (concorrenti, trend, idee) — funziona da subito;
  - 🛠️ **analisi del marketplace mycity** (legge il codice in **sola lettura**)
    — si attiva se colleghi un token GitHub (vedi `.env.example`, è opzionale).
- Dashboard con la chat e metriche segnaposto (i dati reali si collegano dopo).

Il piano completo e le regole sono in `PIANO.md` e `ARCHITETTURA.md`.

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
