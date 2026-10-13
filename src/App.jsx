import React, { useEffect, useMemo, useState } from 'react'
import { Btn, Empty } from './components/ui.jsx'
import Dashboard from './components/Dashboard.jsx'
import BooksView from './components/BooksView.jsx'
import BookDrawer from './components/BookDrawer.jsx'
import TranslatorsView, { TranslatorDrawer } from './components/TranslatorsView.jsx'
import { canWrite, createStore, loadDemoSeed } from './store.js'
import { todayStr } from './logic.js'

const TABS = [
  ['umumiy', 'Umumiy'],
  ['kitoblar', 'Kitoblar'],
  ['tarjimonlar', 'Tarjimonlar'],
]

function readTab() {
  try { return localStorage.getItem('ft-tab') || 'umumiy' } catch { return 'umumiy' }
}

export default function App() {
  const [store, setStore] = useState(null)
  const [data, setData] = useState(null)
  const [tab, setTab] = useState(readTab)
  const [drawer, setDrawer] = useState(null)
  const [writable, setWritable] = useState(null)
  const [dbErr, setDbErr] = useState('')
  const today = todayStr()

  useEffect(() => {
    let alive = true
    createStore().then((s) => { if (alive) setStore(s) })
    canWrite().then((w) => { if (alive) setWritable(w) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!store) return undefined
    return store.subscribe(setData, (e) => setDbErr(e?.message || 'Baza bilan aloqa uzildi.'))
  }, [store])

  useEffect(() => {
    try { localStorage.setItem('ft-tab', tab) } catch {}
  }, [tab])

  const books = data?.books || []
  const translators = useMemo(() => [...(data?.translators || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [data])
  const trMap = useMemo(() => Object.fromEntries(translators.map((t) => [t.id, t])), [translators])
  const canEdit = writable !== false
  const closeDrawer = () => setDrawer(null)
  const openBook = (id) => setDrawer({ type: 'book', id })

  const [seeding, setSeeding] = useState(false)
  async function loadSample() {
    if (!store || seeding) return
    setSeeding(true)
    try {
      await loadDemoSeed(store)
      try { localStorage.setItem('ft-seeded', '1') } catch {}
    } catch (e) {
      setDbErr(e?.message || 'Demo ma’lumot yuklanmadi.')
    } finally {
      setSeeding(false)
    }
  }

  // Demo mode: no shared backend → load the Excel data once per browser.
  useEffect(() => {
    if (!store || !data || store.kind !== 'local') return
    if (data.books.length || data.translators.length) return
    let seeded = false
    try { seeded = localStorage.getItem('ft-seeded') === '1' } catch {}
    if (!seeded) loadSample()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, data])

  const loading = !store || !data
  const empty = !loading && books.length === 0 && translators.length === 0

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky z-30 border-b border-line bg-bg" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="font-cond text-[20px] font-semibold tracking-tight">Falaq Tarjima</span>
            <span className="text-[12px] text-muted">{!store ? '' : store.kind === 'db' ? 'umumiy baza' : 'faqat shu brauzer'}</span>
          </div>
          <nav className="order-3 -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 md:order-none md:mx-0 md:w-auto md:px-0" aria-label="Bo‘limlar">
            {TABS.map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                aria-current={tab === k ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 text-[14px] font-medium transition ${tab === k ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2'}`}
              >
                {l}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex gap-2">
            {canEdit && tab === 'tarjimonlar' ? <Btn kind="ghost" onClick={() => setDrawer({ type: 'translator', id: null })}>+ Tarjimon</Btn> : null}
            {canEdit ? <Btn onClick={() => setDrawer({ type: 'book', id: null })}>+ Kitob</Btn> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-5" style={{ paddingBlock: '1.25rem' }}>
        {writable === false ? (
          <p className="mb-4 rounded-md bg-surface-2 px-3 py-2 text-[13px] text-muted">Sizda faqat ko‘rish huquqi bor — o‘zgartirish uchun egasidan Contributor darajasini so‘rang.</p>
        ) : null}
        {dbErr ? <p className="mb-4 rounded-md bg-bad-soft px-3 py-2 text-[13px] text-bad">{dbErr}</p> : null}

        {loading ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-[88px] animate-pulse rounded-lg border border-line bg-surface" />)}
            </div>
            <p className="text-[13px] text-muted">Umumiy baza yuklanmoqda…</p>
          </div>
        ) : empty ? (
          <Empty title="Hali birorta kitob yo‘q">
            «+ Kitob» tugmasi bilan birinchi kitobni qo‘shing: arabcha nomi, tarjimon, jami sahifa va muddat — qolganini tizim hisoblaydi.
            {store.kind === 'local' ? <div className="mt-3"><Btn kind="soft" onClick={loadSample} disabled={seeding}>{seeding ? 'Yuklanmoqda…' : 'Excel’dagi demo ma’lumotni yuklash'}</Btn></div> : null}
          </Empty>
        ) : tab === 'umumiy' ? (
          <Dashboard books={books} trMap={trMap} onOpen={openBook} today={today} />
        ) : tab === 'kitoblar' ? (
          <BooksView books={books} translators={translators} trMap={trMap} onOpen={openBook} today={today} />
        ) : (
          <TranslatorsView translators={translators} books={books} onOpenBook={openBook} onEdit={(id) => setDrawer({ type: 'translator', id })} today={today} canEdit={canEdit} />
        )}
      </main>

      <footer className="mx-auto w-full max-w-[1120px] px-4 pb-4 text-[12px] text-muted">
        Xavf hisobi: muddat o‘tgan — kechikdi; kerakli tezlik 60 sahifa/haftadan oshsa yoki jarayon tarixiga ko‘ra muddatga ulgurmasa — xavf ostida.
      </footer>

      {drawer?.type === 'book' ? (
        <BookDrawer
          key={drawer.id || 'new'}
          book={drawer.id ? books.find((b) => b.id === drawer.id) : null}
          translators={translators}
          store={store}
          onClose={closeDrawer}
          today={today}
          canEdit={canEdit}
        />
      ) : null}
      {drawer?.type === 'translator' ? (
        <TranslatorDrawer key={drawer.id || 'new'} translator={drawer.id ? trMap[drawer.id] : null} books={books} store={store} onClose={closeDrawer} />
      ) : null}
    </div>
  )
}
