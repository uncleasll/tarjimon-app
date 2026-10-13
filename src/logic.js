// Pure domain logic: dates, pace, risk assessment. No React here, so it can be unit-tested in Node.

export const SEGMENTS = [
  ['diniy', 'Diniy'],
  ['badiiy', 'Badiiy'],
  ['izquvar', 'Izquvar'],
  ['psixologiya', 'Psixologiya'],
  ['bolalar', 'Bolalar'],
  ['boshqa', 'Boshqa'],
]
export const STATUSES = [
  ['navbatda', 'Navbatda'],
  ['tarjimada', 'Tarjimada'],
  ['tugagan', 'Tugagan'],
  ['toxtagan', 'To‘xtagan'],
]
export const PACE_LIMIT = 60 // sahifa/hafta — bundan yuqori talab "xavf" deb belgilanadi
const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']

const pad = (n) => String(n).padStart(2, '0')
export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}
export function addDays(s, n) {
  return new Date(Date.parse(s) + n * 86400000).toISOString().slice(0, 10)
}
export function fmtDate(s, today = todayStr()) {
  if (!s) return '—'
  const [y, m, d] = s.split('-').map(Number)
  return y === Number(today.slice(0, 4)) ? `${d} ${MONTHS[m - 1]}` : `${d} ${MONTHS[m - 1]} ${y}`
}
export function labelOf(list, key) {
  const hit = list.find(([k]) => k === key)
  return hit ? hit[1] : key || '—'
}
export function newId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** Pages per week, from cumulative log points {d: 'YYYY-MM-DD', p: pages}. null = not enough data. */
export function velocity(logs) {
  if (!Array.isArray(logs) || logs.length < 2) return null
  const sorted = [...logs].sort((a, b) => a.d.localeCompare(b.d))
  const last = sorted[sorted.length - 1]
  const cutoff = addDays(last.d, -56)
  const windowed = sorted.filter((l) => l.d >= cutoff)
  const first = windowed[0]
  const days = daysBetween(first.d, last.d)
  if (days < 5) return null
  const delta = last.p - first.p
  return delta <= 0 ? 0 : (delta / days) * 7
}

export function progress(book) {
  const total = Number(book.totalPages) || 0
  const done = Math.min(Number(book.donePages) || 0, total || Infinity)
  if (book.status === 'tugagan') return 100
  if (!total) return 0
  return Math.round((done / total) * 100)
}

/**
 * Assess one book. Returns {key, label, tone, detail, severity, remaining, daysLeft, pace, forecast}.
 * key: done | paused | queued | nodeadline | late | risk | ok
 */
export function assess(book, today = todayStr()) {
  const total = Number(book.totalPages) || 0
  const done = Number(book.donePages) || 0
  const remaining = total ? Math.max(total - done, 0) : null
  const base = { remaining, daysLeft: null, pace: null, forecast: null, velocity: velocity(book.logs) }

  if (book.status === 'tugagan') return { ...base, key: 'done', label: 'Tugagan', tone: 'good', severity: 6, detail: '' }
  if (book.status === 'toxtagan') return { ...base, key: 'paused', label: 'To‘xtagan', tone: 'muted', severity: 5, detail: '' }
  if (book.status === 'navbatda' || !book.translatorId)
    return { ...base, key: 'queued', label: 'Navbatda', tone: 'muted', severity: 4, detail: book.translatorId ? '' : 'tarjimon yo‘q' }
  if (!book.deadline) return { ...base, key: 'nodeadline', label: 'Muddatsiz', tone: 'muted', severity: 3, detail: 'muddat belgilanmagan' }

  const daysLeft = daysBetween(today, book.deadline)
  if (daysLeft < 0)
    return { ...base, daysLeft, key: 'late', label: 'Kechikdi', tone: 'bad', severity: 0, detail: `${-daysLeft} kun o‘tib ketdi` }

  const v = base.velocity
  let forecast = null
  let pace = null
  if (remaining != null && remaining > 0) {
    pace = (remaining / Math.max(daysLeft, 1)) * 7
    if (v) {
      const lastLog = [...book.logs].sort((a, b) => a.d.localeCompare(b.d)).pop()
      forecast = addDays(lastLog.d, Math.ceil((remaining / v) * 7))
    }
  }
  const risky =
    (forecast && forecast > book.deadline) ||
    (v === 0 && remaining > 0) ||
    (forecast == null && pace != null && pace > PACE_LIMIT)
  if (risky) {
    const detail = forecast
      ? `shu tezlikda ${fmtDate(forecast, today)} da tugaydi`
      : v === 0
        ? 'oxirgi haftalarda siljish yo‘q'
        : `haftasiga ${Math.ceil(pace)} sahifa kerak`
    return { ...base, daysLeft, pace, forecast, key: 'risk', label: 'Xavf ostida', tone: 'warn', severity: 1, detail }
  }
  const detail = remaining == null ? 'sahifa soni kiritilmagan' : daysLeft === 0 ? 'bugun muddat' : `${daysLeft} kun qoldi`
  return { ...base, daysLeft, pace, forecast, key: 'ok', label: 'Me’yorda', tone: 'accent', severity: 2, detail }
}

/** Per-translator rollup. */
export function translatorStats(translator, books, today = todayStr()) {
  const mine = books.filter((b) => b.translatorId === translator.id)
  const active = mine.filter((b) => b.status === 'tarjimada')
  const done = mine.filter((b) => b.status === 'tugagan')
  const pagesDone = mine.reduce((s, b) => s + (b.status === 'tugagan' ? Number(b.totalPages) || Number(b.donePages) || 0 : Number(b.donePages) || 0), 0)
  const vs = active.map((b) => velocity(b.logs)).filter((v) => v != null)
  const v = vs.length ? vs.reduce((a, c) => a + c, 0) : null
  const worst = active.map((b) => assess(b, today)).sort((a, b) => a.severity - b.severity)[0] || null
  return { mine, active, done, pagesDone, velocity: v, worst }
}
