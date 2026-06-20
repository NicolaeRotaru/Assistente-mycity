# 📘 PIANO — MyCity OS

> Il piano-madre dell'assistente AI che gestisce e fa crescere MyCity
> (il marketplace dei negozi di Piacenza). Documento vivo: si aggiorna nel tempo.

---

## 1. Visione in una riga
Non un'app con dei pulsanti, ma un **sistema operativo aziendale autonomo**: un
**AD digitale** che 24/7 osserva → capisce → decide → agisce → impara, cercando
e sfruttando ogni opportunità (dalla più grande alla più piccola) per **fare più
soldi, portare clienti ed espandersi** — con l'umano come proprietario che dà la
rotta e firma le decisioni importanti.

## 2. I ruoli
- **Tu (proprietario):** dai gli obiettivi, approvi le decisioni rischiose, resti
  il responsabile legale.
- **L'assistente (AD digitale):** assume, istruisce e supervisiona gli esperti.
- **Gli agenti-esperti (dipendenti digitali):** un'AI specializzata per funzione,
  che fa in autonomia il lavoro ripetitivo di un senior.

## 3. Cosa farà — i reparti
| Reparto | Cosa fa ogni giorno | Cosa produce |
|---|---|---|
| 🧠 Direzione (AD) | priorità, budget per ROI, esperimenti, migliora gli agenti | piano + decisioni |
| 🎧 Supporto clienti | risponde, risolve dubbi, gestisce reclami semplici | clienti felici |
| 🛵 Operations | sorveglia ordini/rider, intercetta problemi consegna | consegne puntuali |
| 📣 Marketing/Growth | contenuti social, ads, SEO locale, recensioni | più visibilità |
| 🤝 Vendite/Onboarding | trova e fa entrare nuovi negozi | più offerta |
| 📊 Analista | report KPI, trova cali/opportunità, prevede domanda | decisioni sui numeri |
| 💶 Finanza | incassi, riconciliazioni, anomalie | conti sotto controllo |
| 🛠️ Tech | analizza il sito mycity, fa sistemare (via Claude Code) | sito migliore |
| 🔎 Intelligence | concorrenti, trend, eventi/meteo, buchi di mercato | opportunità viste prima |

## 4. Il catalogo delle opportunità (macro → micro)
- **Monetizzazione:** commissioni dinamiche · spazi a pagamento per i negozi ·
  upsell nel carrello · soglie "spedizione gratis" ottimizzate · fee di consegna
  dinamica · abbonamento clienti/negozi · recupero carrelli · win-back dormienti ·
  stop al churn negozi.
- **Acquisizione:** SEO locale · social organico · ads a performance · referral ·
  recensioni · partnership locali · micro-influencer · CRO sul sito.
- **Retention/LTV:** personalizzazione · loyalty · re-engagement al momento giusto ·
  promemoria riordino · offerte mirate.
- **Espansione:** nuove categorie · nuovi quartieri/comuni · nuove città
  (playbook) · B2B · white-label/franchising.
- **Efficienza:** percorsi rider · previsione domanda · supporto automatico ·
  meno ordini falliti.
- **Intelligence:** monitor concorrenti · trend · eventi/meteo → picchi · buchi di
  offerta · sentiment.
- **Micro (24/7):** recensione senza risposta → risponde · carrello in fuga →
  nudge · negozio in calo → avviso · prodotto di tendenza → promuove · pagina che
  converte poco → micro-tweak · rider scoperto al picco → riallocazione.

## 5. Cosa userà (lo stack)
Anthropic (cervello) · Supabase (ordini/clienti/rider) · Stripe (incassi) ·
GitHub/mycity (analisi codice, **sola lettura**) · PostHog (statistiche) ·
Meta/IG-FB + TikTok (social/ads) · Google (Business Profile, Ads, Analytics,
Gmail, Calendar) · WhatsApp Business (clienti) · n8n (automazioni) · Email
marketing · Notion/Obsidian (memoria) · Vercel (hosting) · Vault (chiavi).

> Il vero arsenale è più grande e **auto-espandibile**: uso del browser su
> qualsiasi sito, ricerca/scraping web, esecuzione codice, voce/telefono, tutto
> l'ecosistema MCP/API, e la capacità di **costruirsi gli strumenti mancanti**.

## 6. Cosa dovrai fare TU (accessi) — per fasi
**Minimo per partire (gli "occhi"):** Anthropic (hai già) · Supabase (lettura) ·
Stripe (sola lettura) · GitHub token **read-only** su `mycity` · Vercel (env vars).
**Quando attivi marketing:** Meta Business · Google · TikTok · PostHog · WhatsApp
Business API · n8n · email marketing.
**Extra:** Notion/Obsidian (memoria) · password manager/vault.

I 🔴 (Meta, TikTok, WhatsApp API) richiedono verifica della piattaforma: si
affrontano solo quando si arriva a quel reparto.

## 7. Costi realistici
Setup quasi gratis (Supabase/PostHog/n8n/Vercel hanno piani gratis). AI a
consumo, indicativamente **€30–300/mese** con **tetto di spesa**. Pubblicità =
solo il budget che decidi tu. WhatsApp API = piccola fee a conversazione.

## 8. Le fasi (la strada)
| Fase | Cosa attiviamo | Risultato |
|---|---|---|
| **0 — Occhi** | legge dati marketplace + KPI (read-only) | l'AI vede l'azienda |
| **1 — Primo esperto** | il reparto che ruba più tempo | primo tempo/€ liberato |
| **2 — Motore di crescita** | loop di esperimenti automatici | crescita auto-alimentata |
| **3 — Più reparti** | supporto, ops, growth, finance… coordinati | livello operativo coperto |
| **4 — L'AD** | alloca budget per ROI + si auto-migliora | l'azienda si guida da sola |
| **5 — Espansione** | nuove categorie/quartieri/città col playbook | scala oltre Piacenza |

## 9. Principio di costruzione
**Verticale, non orizzontale.** Ogni passo è una versione *completa ma piccola*
che funziona davvero end-to-end, poi si allarga. Non si costruiscono strati
larghi e inerti: si fanno fette sottili che girano.

## 10. La regola d'oro
**Prima mostra cosa farà, poi esegue.** Azioni reversibili e sotto-soglia: da
solo. Azioni rischiose/irreversibili: serve la tua firma.
