import React, { useMemo, useState } from 'react'
import { Bar, Btn, Chip, Drawer, Empty, Field, SectionTitle, inputCls } from './ui.jsx'
import { fmtDate, newId, progress, translatorStats } from '../logic.js'

export default function TranslatorsView({ translators, books, onOpenBook, onEdit, today, canEdit }) {
  const cards = useMemo(
    () => translators.map((t) => ({ t, s: translatorStats(t, books, today) })).sort((x, y) => y.s.active.length - x.s.active.length || x.t.name.localeCompare(y.t.name)),
    [translators, books, today],
  )
  if (!cards.length) return <Empty title="Hali tarjimon yo‘q">Kitob qo‘shganda «+ Yangi tarjimon…» ni tanlang yoki shu yerda qo‘shing.</Empty>
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards.map(({ t, s }) => (
        <section key={t.id} className="flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-cond text-[17px] font-semibold">{t.name}</h3>
              <div className="num text-[12px] text-muted">
                {s.active.length} faol · {s.done.length} tugagan · {s.pagesDone} sahifa
                {s.velocity != null ? ` · ~${Math.round(s.velocity)} sahifa/hafta` : ''}
                {t.telegram ? ` · ${t.telegram}` : ''}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {s.worst && (s.worst.key === 'late' || s.worst.key === 'risk') ? <Chip tone={s.worst.tone}>{s.worst.label}</Chip> : null}
              {canEdit ? <Btn kind="ghost" className="px-2 py-1 text-[12px]" onClick={() => onEdit(t.id)}>Tahrirlash</Btn> : null}
            </div>
          </div>
          {s.active.length ? (
            <ul className="flex flex-col gap-2">
              {s.active.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => onOpenBook(b.id)} className="flex w-full flex-col gap-1 rounded-md px-2 py-1 text-left hover:bg-surface-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate font-arabic text-[15px]"><bdi>{b.titleAr}</bdi></span>
                      <span className="num shrink-0 text-[12px] text-muted">{b.deadline ? fmtDate(b.deadline, today) : 'muddatsiz'}</span>
                    </div>
                    <Bar value={progress(b)} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-muted">Hozir faol kitobi yo‘q.</p>
          )}
        </section>
      ))}
    </div>
  )
}

export function TranslatorDrawer({ translator, books, store, onClose }) {
  const isNew = !translator
  const [name, setName] = useState(translator?.name || '')
  const [telegram, setTelegram] = useState(translator?.telegram || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const assigned = translator ? books.filter((b) => b.translatorId === translator.id).length : 0

  async function save(e) {
    e.preventDefault()
    if (!name.trim()) return setErr('Ism kerak.')
    setBusy(true)
    try {
      const { id: _id, ...rest } = translator || {}
      await store.setTranslator(translator?.id || newId('t'), { ...rest, name: name.trim(), telegram: telegram.trim(), aliases: translator?.aliases || [] })
      onClose()
    } catch (ex) {
      setErr(ex?.message || 'Saqlab bo‘lmadi.')
      setBusy(false)
    }
  }
  async function remove() {
    setBusy(true)
    try {
      await store.deleteTranslator(translator.id)
      onClose()
    } catch (ex) {
      setErr(ex?.message || 'O‘chirib bo‘lmadi.')
      setBusy(false)
    }
  }
  const footer = (
    <div className="flex items-center gap-2">
      {!isNew && !assigned && (confirmDel ? (
        <>
          <Btn kind="danger" onClick={remove} disabled={busy}>Ha, o‘chir</Btn>
          <Btn kind="ghost" onClick={() => setConfirmDel(false)}>Yo‘q</Btn>
        </>
      ) : (
        <Btn kind="ghost" onClick={() => setConfirmDel(true)} disabled={busy}>O‘chirish</Btn>
      ))}
      {!isNew && assigned ? <span className="text-[12px] text-muted">{assigned} ta kitob biriktirilgan</span> : null}
      <Btn type="submit" form="tr-form" className="ml-auto" disabled={busy}>{isNew ? 'Qo‘shish' : 'Saqlash'}</Btn>
    </div>
  )
  return (
    <Drawer title={isNew ? 'Yangi tarjimon' : 'Tarjimon'} onClose={onClose} footer={footer}>
      <form id="tr-form" onSubmit={save} className="flex flex-col gap-4">
        <Field label="Ism"><input id="t-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></Field>
        <Field label="Telegram" hint="@username — eslatmalar uchun"><input id="t-telegram" className={inputCls} value={telegram} onChange={(e) => setTelegram(e.target.value)} /></Field>
        {translator?.aliases?.length ? <p className="text-[12px] text-muted">Excel’dagi yozilishlari: {translator.aliases.join(', ')}</p> : null}
        {err ? <p className="rounded-md bg-bad-soft px-3 py-2 text-[13px] text-bad">{err}</p> : null}
      </form>
    </Drawer>
  )
}
