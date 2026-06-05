/* ═══════════════════════════════════════════════
   storage.js — Firebase Firestore + fallback localStorage
   Ricciardi Studio Dermistico · Total Lift
═══════════════════════════════════════════════ */

// ── FIREBASE CONFIG ──────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCVC6fHbo8OHevILIkI9j_XDyP4GoWCHAQ",
  authDomain:        "landing-total-stripe.firebaseapp.com",
  projectId:         "landing-total-stripe",
  storageBucket:     "landing-total-stripe.firebasestorage.app",
  messagingSenderId: "528151902496",
  appId:             "1:528151902496:web:9da1394fe42a30a36dff45"
};

// ── FIREBASE INIT ────────────────────────────
import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc,
         getDocs, getDoc, setDoc, addDoc,
         updateDoc, deleteDoc, onSnapshot,
         query, orderBy }                         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const _app = initializeApp(firebaseConfig);
const db   = getFirestore(_app);

// ── COLLEZIONI FIRESTORE ─────────────────────
// /bookings/{id}   → prenotazioni
// /config/main     → cfg (pixelId, stripePk, stripeAmount, stripeDesc, adminPw, eventDay)
// /slots/{id}      → slot orari

// ── DEFAULT SLOTS ────────────────────────────
const DEFAULT_SLOTS = [
  { id: 's1', start: '09:00', end: '10:00', blocked: false },
  { id: 's2', start: '10:00', end: '11:00', blocked: false },
  { id: 's3', start: '11:00', end: '12:00', blocked: false },
  { id: 's4', start: '12:00', end: '13:00', blocked: false },
  { id: 's5', start: '14:00', end: '15:00', blocked: false },
  { id: 's6', start: '15:00', end: '16:00', blocked: false },
  { id: 's7', start: '16:00', end: '17:00', blocked: false },
  { id: 's8', start: '17:00', end: '18:00', blocked: false },
];

// ── TL OBJECT ────────────────────────────────
const TL = {

  /* CONFIG */
  _cfg: {},
  async loadCfg() {
    try {
      const snap = await getDoc(doc(db, 'config', 'main'));
      TL._cfg = snap.exists() ? snap.data() : {};
    } catch(e) {
      TL._cfg = JSON.parse(localStorage.getItem('tl_cfg') || '{}');
    }
    return TL._cfg;
  },
  cfg() { return TL._cfg; },
  async saveCfg(data) {
    TL._cfg = { ...TL._cfg, ...data };
    try {
      await setDoc(doc(db, 'config', 'main'), TL._cfg, { merge: true });
    } catch(e) {
      localStorage.setItem('tl_cfg', JSON.stringify(TL._cfg));
    }
  },

  /* PRENOTAZIONI */
  async getBookings() {
    try {
      const snap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) {
      return JSON.parse(localStorage.getItem('tl_bookings') || '[]');
    }
  },
  async addBooking(b) {
    try {
      const ref = await addDoc(collection(db, 'bookings'), b);
      return ref.id;
    } catch(e) {
      const bks = JSON.parse(localStorage.getItem('tl_bookings') || '[]');
      bks.push(b);
      localStorage.setItem('tl_bookings', JSON.stringify(bks));
      return b.id;
    }
  },
  async updateBooking(id, data) {
    try {
      await updateDoc(doc(db, 'bookings', id), data);
    } catch(e) {
      const bks = JSON.parse(localStorage.getItem('tl_bookings') || '[]');
      const i = bks.findIndex(b => b.id === id);
      if (i > -1) { bks[i] = { ...bks[i], ...data }; localStorage.setItem('tl_bookings', JSON.stringify(bks)); }
    }
  },
  async deleteBooking(id) {
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch(e) {
      const bks = JSON.parse(localStorage.getItem('tl_bookings') || '[]').filter(b => b.id !== id);
      localStorage.setItem('tl_bookings', JSON.stringify(bks));
    }
  },

  /* SLOTS */
  async getSlots() {
    try {
      const snap = await getDocs(collection(db, 'slots'));
      if (snap.empty) {
        await TL.initDefaultSlots();
        return DEFAULT_SLOTS;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                      .sort((a,b) => a.start.localeCompare(b.start));
    } catch(e) {
      return JSON.parse(localStorage.getItem('tl_slots') || JSON.stringify(DEFAULT_SLOTS));
    }
  },
  async initDefaultSlots() {
    for (const s of DEFAULT_SLOTS) {
      await setDoc(doc(db, 'slots', s.id), { start: s.start, end: s.end, blocked: s.blocked });
    }
  },
  async saveSlot(id, data) {
    try {
      await setDoc(doc(db, 'slots', id), data, { merge: true });
    } catch(e) {
      const slots = JSON.parse(localStorage.getItem('tl_slots') || JSON.stringify(DEFAULT_SLOTS));
      const i = slots.findIndex(s => s.id === id);
      if (i > -1) slots[i] = { ...slots[i], ...data };
      localStorage.setItem('tl_slots', JSON.stringify(slots));
    }
  },
  async addSlot(slot) {
    try {
      await setDoc(doc(db, 'slots', slot.id), { start: slot.start, end: slot.end, blocked: false });
    } catch(e) {
      const slots = JSON.parse(localStorage.getItem('tl_slots') || JSON.stringify(DEFAULT_SLOTS));
      slots.push(slot);
      localStorage.setItem('tl_slots', JSON.stringify(slots));
    }
  },
  async deleteSlot(id) {
    try {
      await deleteDoc(doc(db, 'slots', id));
    } catch(e) {
      const slots = JSON.parse(localStorage.getItem('tl_slots') || JSON.stringify(DEFAULT_SLOTS)).filter(s => s.id !== id);
      localStorage.setItem('tl_slots', JSON.stringify(slots));
    }
  },

  /* EVENTO */
  eventDay() { return TL._cfg.eventDay || '2025-05-27'; },

  /* REAL-TIME LISTENER prenotazioni (per dashboard) */
  onBookingsChange(callback) {
    try {
      return onSnapshot(
        query(collection(db, 'bookings'), orderBy('createdAt', 'desc')),
        snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );
    } catch(e) {
      return () => {};
    }
  }
};
