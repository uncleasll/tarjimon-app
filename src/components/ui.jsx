import React, { useEffect } from 'react'

const toneText = { good: 'text-good', warn: 'text-warn', bad: 'text-bad', accent: 'text-accent', muted: 'text-muted' }
const toneSoft = {
  good: 'bg-good-soft text-good',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  accent: 'bg-accent-soft text-accent',
  muted: 'bg-surface-2 text-muted',
}
const toneBar = { good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad', accent: 'bg-accent', muted: 'bg-muted' }

export function Chip({ tone = 'muted', children, className = '' }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium leading-5 ${toneSoft[tone] || toneSoft.muted} ${className}`}>
      {children}
    </span>
  )
}

export function Bar({ value, tone = 'accent', className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-2 ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
      <div className={`h-full rounded-full transition-[width] ${toneBar[tone] || toneBar.accent}`} style={{ width: pct + '%' }} />
    </div>
  )
}

export function Stat({ label, value, tone, sub }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <div className="text-[12px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={`num font-cond text-[30px] font-semibold leading-tight ${tone ? toneText[tone] : ''}`}>{value}</div>
      {sub ? <div className="text-[12px] text-muted">{sub}</div> : null}
    </div>
  )
}

export const inputCls =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-[14px] text-fg placeholder:text-muted focus:border-accent disabled:opacity-60'

export function Field({ label, hint, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[12px] font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint ? <span className="text-[12px] text-muted">{hint}</span> : null}
    </label>
  )
}

const btnKinds = {
  primary: 'bg-accent text-accent-fg hover:opacity-90',
  ghost: 'border border-line bg-surface text-fg hover:bg-surface-2',
  danger: 'bg-bad-soft text-bad hover:opacity-90',
  soft: 'bg-accent-soft text-accent hover:opacity-90',
}
export function Btn({ kind = 'primary', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-[14px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${btnKinds[kind] || btnKinds.primary} ${className}`}
      {...props}
    />
  )
}

export function SectionTitle({ children, right }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-cond text-[17px] font-semibold tracking-tight">{children}</h2>
      {right ? <div className="text-[12px] text-muted">{right}</div> : null}
    </div>
  )
}

export function Empty({ title, children }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center">
      <div className="font-cond text-[16px] font-semibold">{title}</div>
      {children ? <div className="mt-1 text-[13px] text-muted">{children}</div> : null}
    </div>
  )
}

export function Drawer({ title, onClose, children, footer }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-stretch md:justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative flex max-h-[92%] w-full flex-col rounded-t-2xl bg-surface shadow-2xl md:h-full md:max-h-none md:w-[460px] md:rounded-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-cond text-[18px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-md px-2 py-1 text-[16px] text-muted hover:bg-surface-2">✕</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? <div className="border-t border-line px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  )
}
