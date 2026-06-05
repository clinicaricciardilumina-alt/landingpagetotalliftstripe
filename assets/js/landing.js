/* ═══════════════════════════════════════════════
   landing.js — Quiz, form, slot, Stripe, successo
   Ricciardi Studio Dermistico · Total Lift
═══════════════════════════════════════════════ */

/* ── UTILITY ── */
function formatDay(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/* ── STATE ── */
const ans = { q1: '', q2: '', q3: '' };
let selSlot = null;
let stripe   = null;
let cardEl   = null;

const STEPS = ['q1','q2','q3','blocked','form','slot','payment'];
const PROG  = { q1:14, q2:28, q3:42, blocked:42, form:57, slot:71, payment:85 };

/* ── STEP NAVIGATION ── */
function showStep(id) {
  STEPS.forEach(s => document.getElementById('step-' + s).classList.add('hidden'));
  document.getElementById('step-' + id).classList.remove('hidden');
  document.getElementById('progress').style.width = (PROG[id] || 14) + '%';
  document.getElementById('flow').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function go(next) {
  if (next === 'q2' && !ans.q1) { alert('Seleziona una risposta'); return; }
  if (next === 'q3' && !ans.q2) { alert('Seleziona una risposta'); return; }
  if (next === 'slot') {
    if (!validateForm()) return;
    renderSlots();
  }
  if (next === 'payment') {
    if (!selSlot) { document.getElementById('slot-err').classList.remove('hidden'); return; }
    document.getElementById('slot-err').classList.add('hidden');
    /* controllo doppia prenotazione */
    const taken = TL.bookings().filter(b =>
      b.ora  === selSlot.start + '-' + selSlot.end &&
      b.data === TL.eventDay() &&
      b.payment !== 'failed'
    );
    if (taken.length) {
      alert('Questo slot è appena stato prenotato. Scegline un altro.');
      renderSlots(); showStep('slot'); return;
    }
    trackEvent('SlotSelected', { slot: selSlot.start });
    trackEvent('InitiateCheckout');
    renderSummary();
    initStripe();
  }
  showStep(next);
}

function afterQ3() {
  if (!ans.q3) { alert('Seleziona una risposta'); return; }
  trackEvent('QuestionarioCompletato');
  if (ans.q3 === 'no') { showStep('blocked'); return; }
  trackEvent('Lead');
  showStep('form');
}

/* ── SELEZIONE OPZIONE (auto-avanza) ── */
function sel(el, q) {
  document.querySelectorAll('#step-' + q + ' .opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  ans[q] = el.dataset.val;

  // Avanza automaticamente dopo 350ms (piccola pausa per vedere la selezione)
  setTimeout(() => {
    if (q === 'q1') go('q2');
    else if (q === 'q2') go('q3');
    else if (q === 'q3') afterQ3();
  }, 350);
}

/* ── VALIDAZIONE FORM ── */
function validateForm() {
  const nome    = document.getElementById('f-nome').value.trim();
  const cognome = document.getElementById('f-cognome').value.trim();
  const email   = document.getElementById('f-email').value.trim();
  const tel     = document.getElementById('f-tel').value.trim();
  const priv    = document.getElementById('f-privacy').checked;
  const err     = document.getElementById('form-err');
  if (!nome || !cognome || !email || !tel) {
    err.textContent = 'Compila tutti i campi obbligatori.';
    err.classList.remove('hidden'); return false;
  }
  if (!priv) {
    err.textContent = 'Devi accettare la Privacy Policy per procedere.';
    err.classList.remove('hidden'); return false;
  }
  err.classList.add('hidden');
  return true;
}

/* ── RENDER SLOT ── */
function renderSlots() {
  const slots = TL.slots();
  const bks   = TL.bookings();
  const day   = TL.eventDay();
  document.getElementById('event-day-disp').value = formatDay(day);
  const grid = document.getElementById('slots-grid');
  grid.innerHTML = '';
  slots.forEach(s => {
    const taken = bks.some(b =>
      b.ora  === s.start + '-' + s.end &&
      b.data === day &&
      b.payment !== 'failed'
    );
    const div = document.createElement('div');
    div.className = 'slot' + (s.blocked ? ' slot--blocked' : taken ? ' slot--taken' : '');
    div.innerHTML = `${s.start} – ${s.end}` +
      (s.blocked ? '<span class="slot__badge">Bloccato</span>' :
       taken      ? '<span class="slot__badge">Occupato</span>' : '');
    if (!s.blocked && !taken) {
      div.onclick = () => {
        document.querySelectorAll('.slot').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        selSlot = s;
      };
    }
    grid.appendChild(div);
  });
}

/* ── RIEPILOGO ── */
function renderSummary() {
  const c     = TL.cfg();
  const price = c.stripeAmount ? (c.stripeAmount / 100).toFixed(2) : '—';
  document.getElementById('summary').innerHTML = `
    <div class="summary__row"><span>Trattamento</span><strong>${c.stripeDesc || 'Consulenza Total Lift'}</strong></div>
    <div class="summary__row"><span>Paziente</span><strong>${document.getElementById('f-nome').value} ${document.getElementById('f-cognome').value}</strong></div>
    <div class="summary__row"><span>Data</span><strong>${formatDay(TL.eventDay())}</strong></div>
    <div class="summary__row"><span>Orario</span><strong>${selSlot ? selSlot.start + ' – ' + selSlot.end : '—'}</strong></div>
    <div class="summary__row summary__total"><span>Totale</span><strong>€ ${price}</strong></div>
  `;
}

/* ── STRIPE ── */
function initStripe() {
  const pk = TL.cfg().stripePk;
  if (!pk || stripe) return;
  stripe = Stripe(pk);
  const elements = stripe.elements();
  cardEl = elements.create('card', {
    style: {
      base: {
        color: '#ffffff', fontFamily: 'DM Sans, sans-serif', fontSize: '16px',
        '::placeholder': { color: 'rgba(255,255,255,0.28)' }
      },
      invalid: { color: '#ff6b6b' }
    }
  });
  cardEl.mount('#card-element');
  cardEl.on('change', e => {
    document.getElementById('card-errors').textContent = e.error ? e.error.message : '';
  });
}

async function handlePay() {
  if (!stripe || !cardEl) { alert('Stripe non configurato. Contatta lo staff.'); return; }
  const btn = document.getElementById('pay-btn');
  btn.classList.add('loading'); btn.disabled = true;
  try {
    const { paymentMethod, error } = await stripe.createPaymentMethod({ type: 'card', card: cardEl });
    if (error) {
      document.getElementById('card-errors').textContent = error.message;
      btn.classList.remove('loading'); btn.disabled = false; return;
    }
    /*
     * ⚠️  PRODUZIONE: invia paymentMethod.id al tuo backend
     * Il backend crea il PaymentIntent e restituisce il clientSecret.
     * Poi chiama stripe.confirmCardPayment(clientSecret).
     * Demo: salva direttamente come pagato.
     */
    saveAndConfirm('paid', TL.cfg().stripeAmount || 0, paymentMethod.id);
  } catch (e) {
    console.error(e);
    btn.classList.remove('loading'); btn.disabled = false;
  }
}

/* ── SALVA E MOSTRA SUCCESSO ── */
function saveAndConfirm(status, amount, ref) {
  const bks = TL.bookings();
  const b = {
    id:         'bk_' + Date.now(),
    nome:       document.getElementById('f-nome').value.trim(),
    cognome:    document.getElementById('f-cognome').value.trim(),
    email:      document.getElementById('f-email').value.trim(),
    tel:        document.getElementById('f-tel').value.trim(),
    note:       document.getElementById('f-note').value.trim(),
    q1: ans.q1, q2: ans.q2, q3: ans.q3,
    data:       TL.eventDay(),
    ora:        selSlot ? selSlot.start + '-' + selSlot.end : '',
    payment:    status,
    amount,
    paymentRef: ref || '',
    promemoria: 'no',
    createdAt:  new Date().toISOString()
  };
  bks.push(b);
  TL.saveBookings(bks);
  trackEvent('Purchase', { value: amount / 100, currency: 'EUR' });
  showSuccess(b);
}

function showSuccess(b) {
  document.getElementById('page-landing').style.display  = 'none';
  const pg = document.getElementById('page-success');
  pg.style.display = 'flex';
  document.getElementById('success-details').innerHTML = `
    <div><span>Nome: </span><strong>${b.nome} ${b.cognome}</strong></div>
    <div><span>Data: </span><strong>${b.data}</strong></div>
    <div><span>Orario: </span><strong>${b.ora.replace('-', ' – ')}</strong></div>
    <div><span>Email: </span><strong>${b.email}</strong></div>
  `;
}

/* ── POPOLA DATE DINAMICHE ── */
function populateDates() {
  const day = TL.eventDay(); // es. "2025-05-27"
  const d = new Date(day + 'T12:00:00');

  // Formato breve: "27 Maggio"
  const short = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });

  // Formato completo con giorno settimana: "Mercoledì 27 Maggio"
  const full = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const fullCap = full.charAt(0).toUpperCase() + full.slice(1);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('date-tag',    short);      // hero tag: "Total Beauty Day · 27 Maggio"
  set('date-hero',   fullCap);    // hero date: "Mercoledì 27 Maggio"
  set('date-strip',  short);      // strip: "Solo 27 Maggio"
  set('date-banner', short);      // cta banner: "del 27 Maggio"
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initPixel();
  trackEvent('PageView');
  populateDates();
});
