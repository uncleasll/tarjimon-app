import React, { useMemo } from 'react'
import { Bar, Chip, Empty, SectionTitle, Stat } from './ui.jsx'
import BookRow from './BookRow.jsx'
import { SEGMENTS, addDays, assess, fmtDate } from '../logic.js'

export default function Dashboard({ books, trMap, onOpen, today }) {
  const view = useMemo(() => {
    const assessed = books.map((b) => ({ b, a: assess(b, today) }))
    const byDeadline = (x, y) => (x.b.deadline || '9999').localeCompare(y.b.deadline || '9999')
    const attention = assessed.filter((x) => x.a.key === 'late' || x.a.key === 'risk').sort((x, y) => x.a.severity - y.a.severity || byDeadline(x, y))
    const horizon = addDays(today, 30)
    const upcoming = assessed
      .filter((x) => x.b.status === 'tarjimada' && x.b.deadline && x.b.deadline >= today && x.b.deadline <= horizon)
      .sort(byDeadline)
    const segs = SEGMENTS.map(([k, l]) => {
      const list = books.filter((b) => b.segment === k)
      if (!list.length) return null
      const total = list.reduce((s, b) => s + (Number(b.totalPages) || 0), 0)
      const done = list.reduce((s, b) => s + (b.status === 'tugagan' ? Number(b.totalPages) || 0 : Math.min(Number(b.donePages) || 0, Number(b.totalPages) || Infinity)), 0)
      return { k, l, count: list.length, doneCount: list.filter((b) => b.status === 'tugagan').length, total, done }
    }).filter(Boolean)
    const totalPages = books.reduce((s, b) => s + (Number(b.totalPages) || 0), 0)
    const donePages = segs.reduce((s, g) => s + g.done, 0)
    return {
      assessed,
      attention,
      upcoming,
      segs,
      totalPages,
      donePages,
      active: books.filter((b) => b.status === 'tarjimada').length,
      done: books.filter((b) => b.status === 'tugagan').length,
      queued: books.filter((b) => b.status === 'navbatda').length,
    }
  }, [books, today])

  const noPages = books.filter((b) => b.status !== 'tugagan' && b.status !== 'navbatda' && !(Number(b.totalPages) > 0)).length

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Jami kitob" value={books.length} sub={`${view.queued} tasi navbatda`} />
        <Stat label="Tarjimada" value={view.active} sub={view.totalPages ? `${view.donePages.toLocaleString('ru-RU')} / ${view.totalPages.toLocaleString('ru-RU')} sahifa` : ''} />
        <Stat label="Tugagan" value={view.done} tone="good" />
        <Stat label="Diqqat talab" value={view.attention.length} tone={view.attention.length ? 'bad' : undefined} sub="kechikkan yoki xavf ostida" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="flex min-w-0 flex-col gap-3">
          <SectionTitle right={view.attention.length ? `${view.attention.length} ta kitob` : ''}>Diqqat talab</SectionTitle>
          {view.attention.length ? (
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              {view.attention.map(({ b, a }) => (
                <div key={b.id}>
                  <BookRow book={b} a={a} translator={trMap[b.translatorId]} onOpen={onOpen} today={today} />
                  <div className="-mt-px border-b border-line px-3 pb-2 text-[12px] text-muted">{a.detail}</div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Hammasi me’yorda">Kechikkan yoki xavf ostidagi kitob yo‘q.</Empty>
          )}
          {noPages ? (
            <p className="text-[12px] text-muted">{noPages} ta tarjimadagi kitobning sahifa soni kiritilmagan — ular uchun tezlik va xavf hisoblanmaydi.</p>
          ) : null}
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionTitle right="30 kun ichida">Yaqin muddatlar</SectionTitle>
            {view.upcoming.length ? (
              <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                {view.upcoming.map(({ b, a }) => (
                  <li key={b.id}>
                    <button type="button" onClick={() => onOpen(b.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2">
                      <span className="num w-14 shrink-0 text-[13px] font-medium">{fmtDate(b.deadline, today)}</span>
                      <span className="min-w-0 flex-1 truncate font-arabic text-[15px]"><bdi>{b.titleAr}</bdi></span>
                      <span className="hidden max-w-[120px] truncate text-[12px] text-muted sm:inline">{trMap[b.translatorId]?.name || ''}</span>
                      <Chip tone={a.tone}>{a.key === 'ok' ? `${a.daysLeft} kun` : a.label}</Chip>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="Yaqin muddat yo‘q">Keyingi 30 kunda hech qaysi kitobning muddati tugamaydi.</Empty>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionTitle>Segmentlar</SectionTitle>
            <ul className="flex flex-col gap-3 rounded-lg border border-line bg-surface px-3 py-3">
              {view.segs.map((g) => {
                const pct = g.total ? Math.round((g.done / g.total) * 100) : 0
                return (
                  <li key={g.k} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-medium">{g.l}</span>
                      <span className="num text-muted">{g.doneCount}/{g.count} kitob · {g.total ? `${pct}%` : 'sahifa yo‘q'}</span>
                    </div>
                    <Bar value={pct} tone={pct === 100 ? 'good' : 'accent'} />
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
