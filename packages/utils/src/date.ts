/**
 * Date helpers for Indian timezone (IST — Asia/Kolkata).
 * All dates stored as UTC in DB, displayed in IST.
 */

const IST = 'Asia/Kolkata'

export function toIST(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function toISTWithTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

export function toISTRelative(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return toIST(date)
}

/** Academic year label: April–March format "2025-26" */
export function getAcademicYearLabel(date?: Date): string {
  const d = date ?? new Date()
  const istDate = new Date(d.toLocaleString('en-US', { timeZone: IST }))
  const year = istDate.getFullYear()
  const month = istDate.getMonth()
  const startYear = month >= 3 ? year : year - 1
  return `${startYear}-${String(startYear + 1).slice(2)}`
}

/** Get start and end of current academic year in UTC */
export function getAcademicYearRange(label?: string): { start: Date; end: Date } {
  const current = label ?? getAcademicYearLabel()
  const startYear = parseInt(current.split('-')[0] ?? current)
  return {
    start: new Date(Date.UTC(startYear, 3, 1)),
    end: new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59)),
  }
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatMonth(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}
