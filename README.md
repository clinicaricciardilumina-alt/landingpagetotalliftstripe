# Total Lift – Ricciardi Studio Dermistico
## Struttura del progetto

```
totallift/
│
├── index.html              ← Landing page principale
│
├── assets/
│   ├── style.css           ← Stylesheet globale condiviso
│   └── app.js              ← Logica condivisa (storage, pixel, utils)
│
└── admin/
    ├── login.html          ← Pagina di accesso staff
    └── dashboard.html      ← Dashboard admin completa
```

---

## Setup rapido

### 1. Stripe
1. Vai su **Dashboard → Impostazioni**
2. Inserisci la tua **Publishable Key** (`pk_live_...`)
3. Inserisci il **prezzo in centesimi** (es. `15000` = €150,00)
4. Inserisci la **descrizione** (es. `Consulenza Total Lift`)

> ⚠️ Per il pagamento reale serve un backend che crei il `PaymentIntent`.  
> Contatta uno sviluppatore per integrare il server-side Stripe.

### 2. Meta Pixel
1. Vai su **Dashboard → Impostazioni**
2. Inserisci il tuo **Pixel ID**

Eventi tracciati automaticamente:
- `PageView` – all'apertura della landing
- `ClickPrenotazione` – al clic sul pulsante prenota
- `QuestionarioCompletato` – dopo le 3 domande
- `Lead` – se disponibile a venire in sede
- `SlotSelected` – alla scelta dell'orario
- `InitiateCheckout` – all'avvio del pagamento
- `Purchase` – dopo pagamento completato

### 3. Accesso dashboard
- URL: `admin/login.html`
- Username: `admin`
- Password default: `ricciardi2025` (modificabile dalle impostazioni)

### 4. Giorno evento e slot
1. Vai su **Dashboard → Gestione Slot**
2. Imposta la **data evento**
3. Blocca/sblocca/aggiungi slot orari

---

## Note tecniche
- I dati vengono salvati in `localStorage` del browser
- Per un ambiente di produzione reale, sostituire con un database + API backend
- Il file è completamente standalone: non richiede server né build tools
