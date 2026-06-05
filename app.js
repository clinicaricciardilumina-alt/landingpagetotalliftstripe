/* ═══════════════════════════════════════
   TOTAL LIFT — Shared App Logic
   Ricciardi Studio Dermistico
═══════════════════════════════════════ */

// ── STORAGE HELPERS ──────────────────────
const TL = {
  cfg:     () => JSON.parse(localStorage.getItem('tl_cfg')      || '{}'),
  saveCfg: (c) => localStorage.setItem('tl_cfg', JSON.stringify({...TL.cfg(),...c})),

  bookings:     () => JSON.parse(localStorage.getItem('tl_bookings') || '[]'),
  saveBookings: (b) => localStorage.setItem('tl_bookings', JSON.stringify(b)),

  defaultSlots: [
    {id:'s1',start:'09:00',end:'10:00',blocked:false},
    {id:'s2',start:'10:00',end:'11:00',blocked:false},
    {id:'s3',start:'11:00',end:'12:00',blocked:false},
    {id:'s4',start:'12:00',end:'13:00',blocked:false},
    {id:'s5',start:'14:00',end:'15:00',blocked:false},
    {id:'s6',start:'15:00',end:'16:00',blocked:false},
    {id:'s7',start:'16:00',end:'17:00',blocked:false},
    {id:'s8',start:'17:00',end:'18:00',blocked:false},
  ],
  slots:     () => JSON.parse(localStorage.getItem('tl_slots') || JSON.stringify(TL.defaultSlots)),
  saveSlots: (s) => localStorage.setItem('tl_slots', JSON.stringify(s)),

  eventDay:  () => TL.cfg().eventDay || '2025-05-27',
};

// ── META PIXEL ───────────────────────────
function trackEvent(name, params = {}) {
  const pid = TL.cfg().pixelId;
  if (!pid) return;
  if (window.fbq) { fbq('track', name, params); return; }
  // lazy init
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', pid);
  fbq('track', 'PageView');
  if (name !== 'PageView') fbq('track', name, params);
}

// ── DATE FORMATTER ───────────────────────
function formatDay(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ── Q1 LABEL ─────────────────────────────
function q1Label(v) {
  const m = {
    asimmetria: 'Asimmetria del viso',
    prevenzione: 'Prevenzione invecchiamento',
    cambiamento: 'Cambiamento visibile',
    fresco: 'Aspetto fresco e armonioso'
  };
  return m[v] || v || '—';
}
