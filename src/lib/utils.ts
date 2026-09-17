export const APP_TIMEZONE = 'Asia/Kolkata'

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

function getPartsInTimezone(date: Date = new Date(), timeZone = APP_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'short',
  })
  const parts = formatter.formatToParts(date)
  const getVal = (type: string) => parts.find(p => p.type === type)?.value || ''
  const year = parseInt(getVal('year'), 10)
  const month = parseInt(getVal('month'), 10)
  const day = parseInt(getVal('day'), 10)
  let hour = parseInt(getVal('hour'), 10)
  if (hour === 24) hour = 0
  const minute = parseInt(getVal('minute'), 10)
  const weekday = getVal('weekday')
  return { year, month, day, hour, minute, weekday }
}

export function getGreeting(timeZone = APP_TIMEZONE): string {
  const { hour } = getPartsInTimezone(new Date(), timeZone)
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatDate(date: Date | string, timeZone = APP_TIMEZONE): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(date: Date | string, timeZone = APP_TIMEZONE): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date: Date | string, timeZone = APP_TIMEZONE): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function getDayString(date: Date | string, timeZone = APP_TIMEZONE): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-CA', { timeZone })
}

export function formatForDateTimeLocal(date: Date | string, timeZone = APP_TIMEZONE): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const { year, month, day, hour, minute } = getPartsInTimezone(d, timeZone)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`
}

export function isToday(date: Date | string, timeZone = APP_TIMEZONE): boolean {
  return getDayString(date, timeZone) === getDayString(new Date(), timeZone)
}

export function isOverdue(dueAt: Date | string | null): boolean {
  if (!dueAt) return false
  return new Date(dueAt).getTime() < Date.now()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function getDayBounds(date: Date | string = new Date(), timeZone = APP_TIMEZONE): { start: Date; end: Date } {
  const d = typeof date === 'string' ? new Date(date) : date
  const { year, month, day } = getPartsInTimezone(d, timeZone)
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = new Date(`${year}-${pad(month)}-${pad(day)}T00:00:00+05:30`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

export function getDayOfWeekInTimezone(date: Date = new Date(), timeZone = APP_TIMEZONE): number {
  const { weekday } = getPartsInTimezone(date, timeZone)
  const daysMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return daysMap[weekday] ?? 0
}

export function getWeekBounds(date: Date | string = new Date(), timeZone = APP_TIMEZONE): { start: Date; end: Date } {
  const d = typeof date === 'string' ? new Date(date) : date
  const { start: todayStart } = getDayBounds(d, timeZone)
  const { weekday } = getPartsInTimezone(d, timeZone)
  const daysMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const dayOfWeek = daysMap[weekday] ?? 0

  const start = new Date(todayStart.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
  return { start, end }
}

export function getMonthBounds(date: Date | string = new Date(), timeZone = APP_TIMEZONE): { start: Date; end: Date } {
  const d = typeof date === 'string' ? new Date(date) : date
  const { year, month } = getPartsInTimezone(d, timeZone)
  const pad = (n: number) => String(n).padStart(2, '0')

  const start = new Date(`${year}-${pad(month)}-01T00:00:00+05:30`)
  const nextMonthYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const end = new Date(new Date(`${nextMonthYear}-${pad(nextMonth)}-01T00:00:00+05:30`).getTime() - 1)
  return { start, end }
}

export function getYearBounds(date: Date | string = new Date(), timeZone = APP_TIMEZONE): { start: Date; end: Date } {
  const d = typeof date === 'string' ? new Date(date) : date
  const { year } = getPartsInTimezone(d, timeZone)
  const start = new Date(`${year}-01-01T00:00:00+05:30`)
  const end = new Date(new Date(`${year + 1}-01-01T00:00:00+05:30`).getTime() - 1)
  return { start, end }
}

export function calculateStreak(completionDates: (Date | string)[], timeZone = APP_TIMEZONE): number {
  if (!completionDates || completionDates.length === 0) return 0

  const dayStrings = Array.from(
    new Set(
      completionDates
        .filter(Boolean)
        .map((d) => getDayString(d, timeZone))
    )
  )

  if (dayStrings.length === 0) return 0

  const days = dayStrings
    .map((str) => {
      const [y, m, d] = str.split('-').map(Number)
      return Date.UTC(y, m - 1, d)
    })
    .sort((a, b) => b - a)

  const todayStr = getDayString(new Date(), timeZone)
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const todayUtc = Date.UTC(ty, tm - 1, td)

  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  const diffFromToday = Math.round((todayUtc - days[0]) / ONE_DAY_MS)

  if (diffFromToday > 1) {
    return 0
  }

  let streak = 1
  for (let i = 0; i < days.length - 1; i++) {
    const dayDiff = Math.round((days[i] - days[i + 1]) / ONE_DAY_MS)
    if (dayDiff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export function getAccountabilityMessage(myRate: number, partnerRate: number): string {
  if (myRate >= 80 && partnerRate >= 80) return "Both on track! Great work."
  if (myRate >= 80 && partnerRate < 50) return "You're doing well. Your partner could use some support."
  if (myRate < 50 && partnerRate >= 80) return "Your partner is on a roll. Time to catch up!"
  if (myRate >= 60 && partnerRate >= 60) return "You're both making progress. Keep it up!"
  if (myRate < 50 && partnerRate < 50) return "Slow day for both of you. That's okay — start small."
  return "Keep going — every task counts."
}

export function getPeriodLabel(period: string): string {
  switch (period) {
    case 'weekly': return 'This Week'
    case 'monthly': return 'This Month'
    case 'yearly': return 'This Year'
    default: return period
  }
}
