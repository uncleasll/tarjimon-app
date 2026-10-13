// Data layer. Inside the claude.ai viewer the `db` capability is a shared, live store for everyone
// who opens the page; anywhere else (vite dev, a saved copy) it falls back to localStorage.
// Swapping in Supabase later means writing one more adapter with the same five methods.

const LS_KEY = 'falaq-tarjima-v1'

function localStore() {
  let state = { books: {}, translators: {} }
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) state = { books: {}, translators: {}, ...JSON.parse(raw) }
  } catch {}
  const subs = new Set()
  const rows = (o) => Object.entries(o).map(([id, d]) => ({ id, ...d }))
  const snapshot = () => ({ books: rows(state.books), translators: rows(state.translators) })
  const persist = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch {}
    subs.forEach((fn) => fn(snapshot()))
  }
  return {
    kind: 'local',
    subscribe(cb) {
      subs.add(cb)
      cb(snapshot())
      return () => subs.delete(cb)
    },
    async setBook(id, data) { state.books[id] = data; persist() },
    async deleteBook(id) { delete state.books[id]; persist() },
    async setTranslator(id, data) { state.translators[id] = data; persist() },
    async deleteTranslator(id) { delete state.translators[id]; persist() },
  }
}

function dbStore(db) {
  const toRows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return {
    kind: 'db',
    subscribe(cb, onError) {
      let books = null
      let translators = null
      const emit = () => { if (books && translators) cb({ books, translators }) }
      const err = (e) => { console.error('db', e); onError && onError(e) }
      const u1 = db.collection('books').onSnapshot((s) => { books = toRows(s); emit() }, err)
      const u2 = db.collection('translators').onSnapshot((s) => { translators = toRows(s); emit() }, err)
      return () => { u1(); u2() }
    },
    setBook: (id, data) => db.doc('books/' + id).set(data),
    deleteBook: (id) => db.doc('books/' + id).delete(),
    setTranslator: (id, data) => db.doc('translators/' + id).set(data),
    deleteTranslator: (id) => db.doc('translators/' + id).delete(),
  }
}

/** Demo data for local mode: public/seed.json (the two Excel files). Loaded once per browser when the store is empty. */
export async function loadDemoSeed(store) {
  const res = await fetch(import.meta.env.BASE_URL + 'seed.json')
  if (!res.ok) throw new Error('seed.json topilmadi')
  const seed = await res.json()
  for (const t of seed.translators || []) { const { id, ...d } = t; await store.setTranslator(id, d) }
  for (const b of seed.books || []) { const { id, ...d } = b; await store.setBook(id, d) }
  return (seed.books || []).length
}

export async function createStore() {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const db = await window.claude.use('db')
      if (db) return dbStore(db)
    }
  } catch (e) {
    console.warn('db unavailable, using local storage', e)
  }
  return localStore()
}

/** true / false, or null when the platform says nothing (keep controls enabled). */
export async function canWrite() {
  try {
    if (!window.claude || typeof window.claude.use !== 'function') return null
    const user = await window.claude.use('user')
    if (!user) return null
    const r = await user.can('data.write')
    return r == null ? null : !!r
  } catch {
    return null
  }
}
