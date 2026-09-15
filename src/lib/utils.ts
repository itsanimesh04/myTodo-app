export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function isToday(date: Date | string): boolean {
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export function isOverdue(dueAt: Date | string | null): boolean {
  if (!dueAt) return false
  return new Date(dueAt) < new Date()
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

export function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - dayOfWeek)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getMonthBounds(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function getYearBounds(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
  return { start, end }
}

export function calculateStreak(completionDates: Date[]): number {
  if (completionDates.length === 0) return 0

  const uniqueDays = [...new Set(
    completionDates.map(d => new Date(d).toDateString())
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    
    if (new Date(uniqueDays[i]).toDateString() === expected.toDateString()) {
      streak++
    } else if (i === 0) {
      // Check if yesterday counts (if today hasn't had completions yet)
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      if (new Date(uniqueDays[i]).toDateString() === yesterday.toDateString()) {
        streak++
      } else {
        break
      }
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
