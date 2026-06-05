/* ═══════════════════════════════════════════════
   storage.js — Gestione dati localStorage
   Ricciardi Studio Dermistico · Total Lift
═══════════════════════════════════════════════ */

const TL = {

  /* CONFIG (stripe, pixel, password, giorno evento) */
  cfg:     () => JSON.parse(localStorage.getItem('tl_cfg') || '{}'),
  saveCfg: (c) => localStorage.setItem('tl_cfg', JSON.stringify({ ...TL.cfg(), ...c })),

  /* PRENOTAZIONI */
  bookings:     () => JSON.parse(localStorage.getItem('tl_bookings') || '[]'),
  saveBookings: (b) => localStorage.setItem('tl_bookings', JSON.stringify(b)),

  /* SLOTS */
  defaultSlots: [
    { id: 's1', start: '09:00', end: '10:00', blocked: false },
    { id: 's2', start: '10:00', end: '11:00', blocked: false },
    { id: 's3', start: '11:00', end: '12:00', blocked: false },
    { id: 's4', start: '12:00', end: '13:00', blocked: false },
    { id: 's5', start: '14:00', end: '15:00', blocked: false },
    { id: 's6', start: '15:00', end: '16:00', blocked: false },
    { id: 's7', start: '16:00', end: '17:00', blocked: false },
    { id: 's8', start: '17:00', end: '18:00', blocked: false },
  ],
  slots:     () => JSON.parse(localStorage.getItem('tl_slots') || JSON.stringify(TL.defaultSlots)),
  saveSlots: (s) => localStorage.setItem('tl_slots', JSON.stringify(s)),

  /* GIORNO EVENTO */
  eventDay: () => TL.cfg().eventDay || '2025-05-27',
};
