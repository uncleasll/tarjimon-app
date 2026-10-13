import React from 'react'
import { Bar, Chip } from './ui.jsx'
import { fmtDate, progress } from '../logic.js'

export default function BookRow({ book, a, translator, onOpen, today }) {
  const pct = progress(book)
  const total = Number(book.totalPages) || 0
  const done = book.status === 'tugagan' && total ? total : Number(book.donePages) || 0
  const barTone = a.key === 'done' ? 'good' : a.tone === 'bad' ? 'bad' : a.tone === 'warn' ? 'warn' : a.key === 'ok' ? 'accent' : 'muted'
  return (
    <button
      type="button"
      onClick={() => onOpen(book.id)}
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-b border-line px-3 py-2.5 text-left transition hover:bg-surface-2 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto]"
    >
      <div className="min-w-0">
        <div className="truncate font-arabic text-[17px] leading-snug">
          <bdi>{book.titleAr}</bdi>
          {book.titleUz ? <span className="ml-2 font-sans text-[13px] text-muted">{book.titleUz}</span> : null}
        </div>
        <div className="truncate text-[12px] text-muted">
          {book.author ? <bdi>{book.author}</bdi> : <span>muallif kiritilmagan</span>}
          {book.publisher ? <span> · <bdi>{book.publisher}</bdi></span> : null}
          {book.note ? <span> · {book.note}</span> : null}
        </div>
      </div>
      <div className="col-span-2 row-start-2 min-w-0 truncate text-[13px] md:col-auto md:row-auto">
        {translator ? translator.name : <span className="text-muted">tarjimon biriktirilmagan</span>}
      </div>
      <div className="col-span-2 row-start-3 min-w-0 md:col-auto md:row-auto">
        <div className="num flex items-center justify-between text-[12px] text-muted">
          <span>{done}/{total || '?'} sahifa</span>
          <span>{pct}%</span>
        </div>
        <Bar value={pct} tone={barTone} className="mt-1" />
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <Chip tone={a.tone}>{a.label}</Chip>
        <span className="num text-[12px] text-muted">{book.deadline ? fmtDate(book.deadline, today) : a.detail}</span>
      </div>
    </button>
  )
}
