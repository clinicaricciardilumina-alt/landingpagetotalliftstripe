/* ═══════════════════════════════════════════════
   dashboard.js — Logica admin dashboard
   Ricciardi Studio Dermistico · Total Lift
═══════════════════════════════════════════════ */

/* ── UTILITY ── */
function formatDay(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function q1Label(v) {
  const m = {
    asimmetria:  'Asimmetria del viso',
    prevenzione: 'Prevenzione invecchiamento',
    cambiamento: 'Cambiamento visibile',
    fresco:      'Aspetto fresco e armonioso'
  };
  return m[v] || v || '—';
}

/* ── AUTH ── */
function checkAuth() {
  if (sessionStorage.getItem('tl_auth') !== '1') {
    window.location.href = 'login.html';
  }
}

function logout() {
  sessionStorage.removeItem('tl_auth');
  window.location.href = 'login.html';
}

/* ── TABS ── */
function switchTab(name, btn) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
  if (name === 'slot-mgr')    renderSlotMgr();
  if (name === 'impostazioni') loadSettings();
}

/* ── STATS ── */
function updateStats() {
  const all  = TL.bookings();
  const paid = all.filter(b => b.payment === 'paid');
  const prom = all.filter(b => b.promemoria === 'no');
  const slots = TL.slots();
  const day   = TL.eventDay();
  const taken = all.filter(b => b.data === day && b.payment !== 'failed').map(b => b.ora);
  const free  = slots.filter(s => !s.blocked && !taken.includes(s.start + '-' + s.end)).length;

  document.getElementById('s-tot').textContent  = all.length;
  document.getElementById('s-paid').textContent = paid.length;
  document.getElementById('s-inc').textContent  = '€' + paid.reduce((a, b) => a + (b.amount / 100 || 0), 0).toFixed(0);
  document.getElementById('s-prom').textContent = prom.length;
  document.getElementById('s-free').textContent = free;
}

/* ── TABELLA PRENOTAZIONI ── */
function renderBookings() {
  updateStats();
  let bks = TL.bookings();

  const fd = document.getElementById('f-day').value;
  const fp = document.getElementById('f-payment').value;
  const fr = document.getElementById('f-reminder').value;
  const ft = document.getElementById('f-time').value.trim();

  if (fd) bks = bks.filter(b => b.data === fd);
  if (fp) bks = bks.filter(b => b.payment === fp);
  if (fr) bks = bks.filter(b => b.promemoria === fr);
  if (ft) bks = bks.filter(b => b.ora.startsWith(ft));

  const tb = document.getElementById('tbody');
  tb.innerHTML = '';

  if (!bks.length) {
    tb.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:2.5rem;color:var(--mid)">Nessuna prenotazione trovata.</td></tr>';
    return;
  }

  bks.forEach((b, i) => {
    const pmB = b.payment === 'paid' ? 'badge--paid' : b.payment === 'failed' ? 'badge--failed' : 'badge--pending';
    const pmL = b.payment === 'paid' ? 'Pagato' : b.payment === 'failed' ? 'Fallito' : 'In attesa';
    const prB = b.promemoria === 'si' ? 'badge--yes' : 'badge--no';
    const dt  = b.createdAt ? new Date(b.createdAt).toLocaleString('it-IT') : '—';
    const ora = b.ora ? b.ora.replace('-', ' – ') : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><strong>${b.nome} ${b.cognome}</strong></td>
      <td>${b.tel || '—'}</td>
      <td style="font-size:0.73rem">${b.email || '—'}</td>
      <td>${b.data || '—'}</td>
      <td><strong>${ora}</strong></td>
      <td class="wrap">${q1Label(b.q1)}</td>
      <td>${b.q2 || '—'}</td>
      <td>${b.q3 === 'si' ? '✅ Sì' : '❌ No'}</td>
      <td><span class="badge ${pmB}">${pmL}</span></td>
      <td>${b.amount ? '€' + (b.amount / 100).toFixed(2) : '—'}</td>
      <td class="wrap">${b.note || '—'}</td>
      <td>
        <span class="badge ${prB}">${b.promemoria === 'si' ? 'Inviato' : 'Non inviato'}</span><br>
        <button class="act ${b.promemoria === 'si' ? 'act-danger' : 'act-green'}" style="margin-top:4px" onclick="toggleProm('${b.id}')">
          ${b.promemoria === 'si' ? '↩ Reset' : '✓ Segna inviato'}
        </button>
      </td>
      <td style="font-size:0.72rem;color:var(--mid)">${dt}</td>
      <td>
        <div class="actions">
          <button class="act" onclick="openEdit('${b.id}')">✏️</button>
          <button class="act act-danger" onclick="delBooking('${b.id}')">🗑</button>
        </div>
      </td>
    `;
    tb.appendChild(tr);
  });
}

function clearFilters() {
  ['f-day', 'f-time'].forEach(id => document.getElementById(id).value = '');
  ['f-payment', 'f-reminder'].forEach(id => document.getElementById(id).value = '');
  renderBookings();
}

function toggleProm(id) {
  const bks = TL.bookings();
  const b   = bks.find(x => x.id === id);
  if (b) b.promemoria = b.promemoria === 'si' ? 'no' : 'si';
  TL.saveBookings(bks);
  renderBookings();
}

function delBooking(id) {
  if (!confirm('Eliminare questa prenotazione? L\'azione è irreversibile.')) return;
  TL.saveBookings(TL.bookings().filter(b => b.id !== id));
  renderBookings();
}

/* ── EDIT MODAL ── */
function openEdit(id) {
  const b = TL.bookings().find(x => x.id === id);
  if (!b) return;
  document.getElementById('edit-id').value      = id;
  document.getElementById('e-nome').value       = b.nome;
  document.getElementById('e-cognome').value    = b.cognome;
  document.getElementById('e-email').value      = b.email;
  document.getElementById('e-tel').value        = b.tel;
  document.getElementById('e-ora').value        = b.ora;
  document.getElementById('e-note').value       = b.note || '';
  document.getElementById('modal-bg').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
}

function saveEdit() {
  const id  = document.getElementById('edit-id').value;
  const bks = TL.bookings();
  const b   = bks.find(x => x.id === id);
  if (b) {
    b.nome    = document.getElementById('e-nome').value;
    b.cognome = document.getElementById('e-cognome').value;
    b.email   = document.getElementById('e-email').value;
    b.tel     = document.getElementById('e-tel').value;
    b.ora     = document.getElementById('e-ora').value;
    b.note    = document.getElementById('e-note').value;
    TL.saveBookings(bks);
  }
  closeModal();
  renderBookings();
}

/* ── CSV EXPORT ── */
function exportCSV() {
  const bks = TL.bookings();
  if (!bks.length) { alert('Nessun dato da esportare.'); return; }

  const H = ['ID','Nome','Cognome','Email','Telefono','Data','Orario','Q1','Q2','Q3','Pagamento','Importo','Note','Promemoria','Creato il'];
  const R = bks.map(b => [
    b.id, b.nome, b.cognome, b.email, b.tel, b.data, b.ora,
    b.q1, b.q2, b.q3, b.payment, b.amount ? b.amount / 100 : '',
    b.note || '', b.promemoria, b.createdAt
  ]);
  const csv = [H, ...R].map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'totallift_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
}

/* ── SLOT MANAGER ── */
function renderSlotMgr() {
  document.getElementById('admin-day').value = TL.eventDay();
  const slots = TL.slots();
  const bks   = TL.bookings();
  const day   = TL.eventDay();
  const list  = document.getElementById('slot-list');
  list.innerHTML = '';

  slots.forEach(s => {
    const taken = bks.some(b =>
      b.ora  === s.start + '-' + s.end &&
      b.data === day &&
      b.payment !== 'failed'
    );
    const div = document.createElement('div');
    div.className = 'slot-item';
    div.innerHTML = `
      <div>
        <div class="slot-item__time">${s.start} – ${s.end}</div>
        <div class="slot-item__status">${s.blocked ? '🔒 Bloccato' : taken ? '✅ Prenotato' : '🟢 Libero'}</div>
      </div>
      <div class="slot-item__acts">
        <button class="act ${s.blocked ? 'act-green' : ''}" onclick="toggleBlock('${s.id}')">${s.blocked ? 'Sblocca' : 'Blocca'}</button>
        ${!taken ? `<button class="act act-danger" onclick="removeSlot('${s.id}')">Elimina</button>` : '<button class="act" disabled style="opacity:.3">—</button>'}
      </div>
    `;
    list.appendChild(div);
  });
}

function saveEventDay() {
  TL.saveCfg({ eventDay: document.getElementById('admin-day').value });
  renderSlotMgr();
  updateStats();
}

function toggleBlock(id) {
  const slots = TL.slots();
  const s = slots.find(x => x.id === id);
  if (s) s.blocked = !s.blocked;
  TL.saveSlots(slots);
  renderSlotMgr();
  updateStats();
}

function removeSlot(id) {
  if (!confirm('Eliminare questo slot?')) return;
  TL.saveSlots(TL.slots().filter(s => s.id !== id));
  renderSlotMgr();
  updateStats();
}

function addSlot() {
  const start = document.getElementById('ns-start').value;
  const end   = document.getElementById('ns-end').value;
  if (!start || !end) { alert('Inserisci orario di inizio e fine.'); return; }
  const slots = TL.slots();
  slots.push({ id: 's' + Date.now(), start, end, blocked: false });
  slots.sort((a, b) => a.start.localeCompare(b.start));
  TL.saveSlots(slots);
  document.getElementById('ns-start').value = '';
  document.getElementById('ns-end').value   = '';
  renderSlotMgr();
}

/* ── SETTINGS ── */
function loadSettings() {
  const c = TL.cfg();
  document.getElementById('cfg-pixel').value  = c.pixelId  || '';
  document.getElementById('cfg-pk').value     = c.stripePk || '';
  document.getElementById('cfg-amount').value = c.stripeAmount || '';
  document.getElementById('cfg-desc').value   = c.stripeDesc || 'Consulenza Total Lift';
  document.getElementById('cfg-pw').value     = c.adminPw  || 'ricciardi2025';
}

function saveCfgField(key, inputId, indId) {
  TL.saveCfg({ [key]: document.getElementById(inputId).value });
  flashSave(indId);
}

function saveCfgFields(keys, inputIds, indId) {
  const obj = {};
  keys.forEach((k, i) => {
    const v = document.getElementById(inputIds[i]).value;
    obj[k] = k === 'stripeAmount' ? parseInt(v) || 0 : v;
  });
  TL.saveCfg(obj);
  flashSave(indId);
}

function flashSave(id) {
  const el = document.getElementById(id);
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2000);
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  renderBookings();
  /* chiudi modal cliccando fuori */
  document.getElementById('modal-bg').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-bg')) closeModal();
  });
});
