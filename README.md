# Total Lift – Ricciardi Studio Dermistico

## Struttura del progetto

```
totallift/
│
├── index.html                  ← Landing page principale
├── vercel.json                 ← Configurazione Vercel
├── .gitignore
│
├── assets/
│   ├── css/
│   │   ├── global.css          ← Variabili, reset, componenti condivisi
│   │   ├── landing.css         ← Stili landing page
│   │   └── dashboard.css       ← Stili admin login + dashboard
│   │
│   └── js/
│       ├── storage.js          ← Gestione localStorage (TL object)
│       ├── pixel.js            ← Meta Pixel tracking
│       ├── landing.js          ← Quiz, form, slot, Stripe, successo
│       └── dashboard.js        ← Logica admin dashboard
│
└── admin/
    ├── login.html              ← Pagina di accesso staff
    └── dashboard.html          ← Dashboard admin completa
```

---

## Deploy su Vercel (da GitHub)

```bash
# 1. Inizializza repo
git init
git add .
git commit -m "Total Lift v1.0"

# 2. Crea repo su GitHub e pusha
git remote add origin https://github.com/tuoaccount/totallift.git
git push -u origin main

# 3. Su vercel.com → Add New Project → importa il repo → Deploy
```

---

## Configurazione iniziale (dalla dashboard)

Vai su `/admin/login.html` → accedi con `admin` / `ricciardi2025`

### Stripe
- Publishable Key (`pk_live_...`)
- Prezzo in centesimi (es. `15000` = €150,00)
- Descrizione (es. `Consulenza Total Lift`)

> ⚠️ Per pagamenti reali serve un backend con il PaymentIntent.

### Meta Pixel
- Inserisci il Pixel ID nel tab Impostazioni

### Giorno e slot
- Tab "Gestione Slot" → imposta data evento e orari

---

## Credenziali default
- Username: `admin`
- Password: `ricciardi2025` (modificabile dalle Impostazioni)

---

## Note tecniche
- Dati salvati in `localStorage` del browser
- Per produzione reale: sostituire con database + API backend
- Nessun build tool necessario, tutto statico
