import React, { useMemo, useState } from 'react'
import { Empty, inputCls } from './ui.jsx'
import BookRow from './BookRow.jsx'
import { SEGMENTS, STATUSES, assess, progress } from '../logic.js'

const SORTS = [
  ['severity', 'Diqqat bo‘yicha'],
  ['deadline', 'Muddat bo‘yicha'],
  ['progress', 'Jarayon bo‘yicha'],
  ['title', 'Nomi bo‘yicha'],
]

export default function BooksView({ books, translators, trMap, onOpen, today }) {
  const [q, setQ] = useState('')
  const [seg, setSeg] = useState('')
  const [st, setSt] = useState('')
  const [tr, setTr] = useState('')
  const [sort, setSort] = useState('severity')

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = books
      .filter((b) => !seg || b.segment === seg)
      .filter((b) => !st || b.status === st)
      .filter((b) => !tr || (tr === '__none' ? !b.translatorId : b.translatorId === tr))
      .filter((b) => {
        if (!needle) return true
        const hay = [b.titleAr, b.titleUz, b.author, b.publisher, b.note, trMap[b.translatorId]?.name].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(needle)
      })
      .map((b) => ({ b, a: assess(b, today) }))
    const cmp = {
      severity: (x, y) => x.a.severity - y.a.severity || (x.b.deadline || '9999').localeCompare(y.b.deadline || '9999'),
      deadline: (x, y) => (x.b.deadline || '9999').localeCompare(y.b.deadline || '9999'),
      progress: (x, y) => progress(y.b) - progress(x.b),
      title: (x, y) => x.b.titleAr.localeCompare(y.b.titleAr),
    }[sort]
    return list.sort(cmp)
  }, [books, trMap, q, seg, st, tr, sort, today])

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <input id="f-q" className={`${inputCls} col-span-2 md:col-span-1`} placeholder="Qidirish: nom, muallif, tarjimon…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select id="f-seg" className={inputCls} value={seg} onChange={(e) => setSeg(e.target.value)} aria-label="Segment">
          <option value="">Barcha segment</option>
          {SEGMENTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select id="f-st" className={inputCls} value={st} onChange={(e) => setSt(e.target.value)} aria-label="Holat">
          <option value="">Barcha holat</option>
          {STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select id="f-tr" className={inputCls} value={tr} onChange={(e) => setTr(e.target.value)} aria-label="Tarjimon">
          <option value="">Barcha tarjimon</option>
          <option value="__none">Tarjimonsiz</option>
          {translators.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select id="f-sort" className={inputCls} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash">
          {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      <div className="text-[12px] text-muted">{rows.length} ta kitob</div>

      {rows.length ? (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] gap-x-3 border-b border-line bg-surface-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted md:grid">
            <span>Kitob</span><span>Tarjimon</span><span>Jarayon</span><span className="text-right">Holat · muddat</span>
          </div>
          {rows.map(({ b, a }) => (
            <BookRow key={b.id} book={b} a={a} translator={trMap[b.translatorId]} onOpen={onOpen} today={today} />
          ))}
        </div>
      ) : (
        <Empty title="Mos kitob topilmadi">Filtrlarni o‘zgartirib ko‘ring.</Empty>
      )}
    </div>
  )
}
