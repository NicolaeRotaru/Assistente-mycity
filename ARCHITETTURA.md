# 🏗️ ARCHITETTURA — MyCity OS

> Il manuale di governo del sistema. Ogni domanda difficile ha una **regola**.
> Quando costruiamo un pezzo, deve rispettare queste regole.

---

## A. Come nascono gli agenti-esperti
Un agente è una risorsa **permanente e versionata**, assemblata da 7 ingredienti:
1. **Mansionario** (ruolo, obiettivo, limiti, tono, quando fermarsi e chiedere)
2. **Strumenti** (solo quelli che gli servono — minimo privilegio)
3. **Competenze/manuali** (procedure, esempi, accesso alla memoria)
4. **Memoria propria** (cosa ha imparato)
5. **Criteri di "fatto bene"** (una rubrica per auto-valutarsi)
6. **Freni** (budget, livello di approvazione, limiti di frequenza)
7. **Innesco** (a richiesta / a orari / al verificarsi di un evento)

L'AD può **creare nuovi agenti** quando scopre un buco (meta-capacità) e
**migliorarli** riscrivendone il mansionario in base ai risultati (nuova versione).

## B. Quanti agenti
Elastico, a due livelli:
- **Nucleo stabile:** ~7–12 capi-reparto (organigramma fisso).
- **Sciame on-demand:** operai usa-e-getta per singolo compito, da pochi a
  centinaia in parallelo nei picchi, poi dismessi.
Scala col lavoro. Si pagano solo i minuti di lavoro, non stipendi.

## C. Le 15 domande → le regole

**Creazione & organico**
1. *Quando creare un agente?* → solo se il compito è ricorrente, distinto e vale
   il costo. Altrimenti riusa o spezza in sotto-task.
2. *Build vs buy di uno strumento?* → usa l'esistente se affidabile; costruiscilo
   solo se dà un vantaggio reale.

**Coordinamento**
3. *Come evitare il caos?* → gerarchia chiara + stato condiviso + regole di
   precedenza. In conflitto decide il capo-reparto, poi l'AD.
4. *Chi ha l'autorità su cosa?* → deleghe esplicite, separazione dei poteri,
   soglie 🟢🟡🔴, doppia firma sul denaro.

**Qualità & errori**
5. *Come sapere se lavora bene?* → rubriche + un valutatore indipendente + KPI +
   A/B. L'AD campiona a sorpresa (controlla il controllore).
6. *Quando sbaglia/allucina?* → prova a vuoto prima di agire, verifica contro i
   dati reali, raggio d'azione limitato, rollback, escalation all'umano.

**Soldi & controllo**
7. *Come non bruciare budget?* → tetto per agente, contabilità del ROI per
   azione, stop automatico, kill-switch.
8. *Come resti in controllo?* → cruscotto + log di tutto + override + pulsante
   "spiegami perché".

**Mondo reale**
9. *Dove non c'è API?* → browser automation + voce + umano per l'ultimo miglio.
10. *Imprevisti* (rider non risponde, fornitore dice no, pagamento fallisce)? →
    percorsi di eccezione e ripiego all'umano.

**Sicurezza, legge, deriva**
11. *Credenziali?* → cassaforte, minimo privilegio, segreti mai nei messaggi,
    rotazione.
12. *Privacy/responsabilità?* → GDPR sui clienti, contratti; l'umano resta il
    responsabile legale.
13. *Auto-miglioramento senza deriva?* → cambia i propri agenti solo dopo aver
    superato un "esame" su casi di prova. Niente auto-modifica selvaggia.

**Scala & limiti**
14. *Scala a 10x/100x?* → parallelismo, modelli economici per i task semplici e
    potenti per quelli difficili, caching.
15. *Cosa NON può/deve fare?* → relazioni di fiducia profonde, scommesse di
    visione, responsabilità legale, giudizio etico finale. Resta umano.

## D. Il ciclo di autonomia (come "ci pensa lui")
Loop perpetuo: **Osserva → Capisce → Decide → Agisce → Impara.** Genera ipotesi
→ fa piccoli esperimenti → misura → raddoppia sui vincitori, uccide i perdenti →
mette tutto in memoria. È una macchina di esperimenti che non dorme.

## E. I tre livelli di azione (la regola d'oro, operativa)
- 🟢 **Verde** — reversibile e sotto-soglia → **fa da solo**.
- 🟡 **Giallo** — impatto medio → **fa e ti avvisa**.
- 🔴 **Rosso** — soldi grossi, legale, irreversibile → **serve la tua firma**.

## F. I freni di sicurezza (perché l'autonomia è sicura)
Tetti di spesa · kill-switch · audit completo · "simula prima di agire" sulle
mosse importanti · rilascio a tappe degli esperimenti · niente azioni
irreversibili senza firma.

## G. Il volano
Più dati → decisioni migliori → più crescita → più dati… e l'assistente migliora
i suoi stessi agenti. Vantaggio che composta nel tempo.

## H. Principio architetturale
Ogni passo è **verticale**: una fetta sottile che funziona end-to-end (interfaccia
→ orchestratore → strumenti → risultato → memoria), poi si allarga. Tool-use
(la capacità di usare strumenti) è il mattone fondante di tutto: senza quello,
l'AI chiacchiera soltanto.
