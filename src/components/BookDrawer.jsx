import React, { useState } from 'react'
import { Btn, Chip, Drawer, Field, inputCls } from './ui.jsx'
import { SEGMENTS, STATUSES, assess, fmtDate, newId } from '../logic.js'

const blank = { titleAr: '', titleUz: '', author: '', publisher: '', segment: 'badiiy', translatorId: '', totalPages: '', donePages: '', deadline: '', status: 'navbatda', note: '' }

export default function BookDrawer({ book, translators, store, onClose, today, canEdit }) {
  const isNew = !book
  const [f, setF] = useState(() => (book ? { ...blank, ...book } : { ...blank }))
  const [newTr, setNewTr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const a = book ? assess(book, today) : null
  const logs = Array.isArray(book?.logs) ? [...book.logs].sort((x, y) => y.d.localeCompare(x.d)) : []

  async function save(e) {
    e.preventDefault()
    if (!f.titleAr.trim()) return setErr('Kitob nomini kiriting.')
    setBusy(true)
    setErr('')
    try {
      let translatorId = f.translatorId
      if (translatorId === '__new') {
        const name = newTr.trim()
        if (!name) { setBusy(false); return setErr('Yangi tarjimon ismini yozing.') }
        translatorId = newId('t')
        await store.setTranslator(translatorId, { name, telegram: '', aliases: [] })
      }
      const total = Math.max(0, parseInt(f.totalPages, 10) || 0)
      let done = Math.max(0, parseInt(f.donePages, 10) || 0)
      if (total && done > total) done = total
      if (f.status === 'tugagan' && total) done = total
      const nextLogs = Array.isArray(book?.logs) ? book.logs.map((l) => ({ ...l })) : []
      const prevDone = Number(book?.donePages) || 0
      if (isNew ? done > 0 : done !== prevDone) {
        const i = nextLogs.findIndex((l) => l.d === today)
        if (i >= 0) nextLogs[i] = { d: today, p: done }
        else nextLogs.push({ d: today, p: done })
      }
      const doc = {
        titleAr: f.titleAr.trim(),
        titleUz: f.titleUz.trim(),
        author: f.author.trim(),
        publisher: f.publisher.trim(),
        segment: f.segment,
        translatorId,
        totalPages: total,
        donePages: done,
        deadline: f.deadline || '',
        status: f.status,
        note: f.note.trim(),
        logs: nextLogs,
        createdAt: book?.createdAt || today,
        updatedAt: today,
      }
      await store.setBook(book?.id || newId('b'), doc)
      onClose()
    } catch (ex) {
      setErr(ex?.message || 'Saqlab bo‘lmadi. Qayta urinib ko‘ring.')
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await store.deleteBook(book.id)
      onClose()
    } catch (ex) {
      setErr(ex?.message || 'O‘chirib bo‘lmadi.')
      setBusy(false)
    }
  }

  const footer = canEdit ? (
    <div className="flex items-center gap-2">
      {!isNew && (confirmDel ? (
        <>
          <span className="text-[13px] text-bad">Rostdan o‘chirilsinmi?</span>
          <Btn kind="danger" onClick={remove} disabled={busy}>Ha, o‘chir</Btn>
          <Btn kind="ghost" onClick={() => setConfirmDel(false)}>Yo‘q</Btn>
        </>
      ) : (
        <Btn kind="ghost" onClick={() => setConfirmDel(true)} disabled={busy}>O‘chirish</Btn>
      ))}
      <Btn type="submit" form="book-form" className="ml-auto" disabled={busy}>{busy ? 'Saqlanmoqda…' : isNew ? 'Qo‘shish' : 'Saqlash'}</Btn>
    </div>
  ) : null

  return (
    <Drawer title={isNew ? 'Yangi kitob' : 'Kitob'} onClose={onClose} footer={footer}>
      <form id="book-form" onSubmit={save} className="flex flex-col gap-4">
        {a ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-[13px]">
            <Chip tone={a.tone}>{a.label}</Chip>
            <span className="text-muted">{a.detail}</span>
            {a.velocity ? <span className="num ml-auto text-muted">~{Math.round(a.velocity)} sahifa/hafta</span> : null}
          </div>
        ) : null}
        <fieldset disabled={!canEdit || busy} className="flex flex-col gap-4">
          <Field label="Kitob nomi (arabcha)">
            <input id="b-titleAr" dir="auto" className={`${inputCls} font-arabic text-[17px]`} value={f.titleAr} onChange={set('titleAr')} required />
          </Field>
          <Field label="O‘zbekcha nomi" hint="ixtiyoriy — ishchi nom">
            <input id="b-titleUz" className={inputCls} value={f.titleUz} onChange={set('titleUz')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Muallif"><input id="b-author" dir="auto" className={inputCls} value={f.author} onChange={set('author')} /></Field>
            <Field label="Nashriyot"><input id="b-publisher" dir="auto" className={inputCls} value={f.publisher} onChange={set('publisher')} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Segment">
              <select id="b-segment" className={inputCls} value={f.segment} onChange={set('segment')}>
                {SEGMENTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field label="Holat">
              <select id="b-status" className={inputCls} value={f.status} onChange={set('status')}>
                {STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Tarjimon">
            <select id="b-translator" className={inputCls} value={f.translatorId} onChange={set('translatorId')}>
              <option value="">— biriktirilmagan —</option>
              {translators.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              <option value="__new">+ Yangi tarjimon…</option>
            </select>
          </Field>
          {f.translatorId === '__new' ? (
            <Field label="Yangi tarjimon ismi">
              <input id="b-newTr" className={inputCls} value={newTr} onChange={(e) => setNewTr(e.target.value)} autoFocus />
            </Field>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jami sahifa"><input id="b-total" type="number" min="0" inputMode="numeric" className={`${inputCls} num`} value={f.totalPages} onChange={set('totalPages')} /></Field>
            <Field label="Qilingan sahifa" hint="o‘zgarsa tarixga yoziladi"><input id="b-done" type="number" min="0" inputMode="numeric" className={`${inputCls} num`} value={f.donePages} onChange={set('donePages')} /></Field>
          </div>
          <Field label="Muddat"><input id="b-deadline" type="date" className={`${inputCls} num`} value={f.deadline} onChange={set('deadline')} /></Field>
          <Field label="Izoh"><input id="b-note" className={inputCls} value={f.note} onChange={set('note')} placeholder="masalan: 1-qism tugagan" /></Field>
        </fieldset>
        {err ? <p className="rounded-md bg-bad-soft px-3 py-2 text-[13px] text-bad">{err}</p> : null}
        {logs.length ? (
          <div className="flex flex-col gap-1">
            <div className="text-[12px] font-medium uppercase tracking-wide text-muted">Jarayon tarixi</div>
            <ul className="num divide-y divide-line rounded-md border border-line text-[13px]">
              {logs.slice(0, 8).map((l, i) => {
                const prev = logs[i + 1]
                return (
                  <li key={l.d} className="flex justify-between px-3 py-1.5">
                    <span className="text-muted">{fmtDate(l.d, today)}</span>
                    <span>{l.p} sahifa{prev ? <span className="text-muted"> (+{Math.max(l.p - prev.p, 0)})</span> : null}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </form>
    </Drawer>
  )
}
