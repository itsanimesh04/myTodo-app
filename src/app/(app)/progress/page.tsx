'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { BarChart3, Flame, TrendingUp, Calendar } from 'lucide-react'
import { getInitials, getAccountabilityMessage } from '@/lib/utils'

interface MemberStats {
  userId: string
  userName: string
  userAvatar: string | null
  tasksCompletedToday: number
  totalTasksToday: number
  tasksCompletedWeek: number
  totalTasksWeek: number
  tasksCompletedMonth: number
  totalTasksMonth: number
  completionRateToday: number
  completionRateWeek: number
  completionRateMonth: number
  currentStreak: number
}

export default function ProgressPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [stats, setStats] = useState<{
    members: MemberStats[]
    heatmap: Record<string, number>
    houseName: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    fetch('/api/progress')
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Progress</h1>
        </div>
        <div className="grid-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton skeleton-card"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats || stats.members.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Progress</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <BarChart3 className="empty-state-icon" />
            <p className="empty-state-title">No progress yet</p>
            <p className="empty-state-description">Start completing tasks to see your progress here.</p>
          </div>
        </div>
      </div>
    )
  }

  const me = stats.members.find((m) => m.userId === userId)
  const partner = stats.members.find((m) => m.userId !== userId)

  const getRate = (member: MemberStats | undefined) => {
    if (!member) return 0
    if (period === 'today') return member.completionRateToday
    if (period === 'week') return member.completionRateWeek
    return member.completionRateMonth
  }

  const getCompleted = (member: MemberStats | undefined) => {
    if (!member) return 0
    if (period === 'today') return member.tasksCompletedToday
    if (period === 'week') return member.tasksCompletedWeek
    return member.tasksCompletedMonth
  }

  const getTotal = (member: MemberStats | undefined) => {
    if (!member) return 0
    if (period === 'today') return member.totalTasksToday
    if (period === 'week') return member.totalTasksWeek
    return member.totalTasksMonth
  }

  // Heatmap
  const heatmapEntries = Object.entries(stats.heatmap || {})
  const maxHeatmapValue = Math.max(...heatmapEntries.map(([, v]) => v), 1)

  // Generate last 90 days
  const heatmapDays = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const count = stats.heatmap?.[key] || 0
    let level = 0
    if (count > 0) level = Math.min(4, Math.ceil((count / maxHeatmapValue) * 4))
    heatmapDays.push({ date: key, count, level })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Progress</h1>
      </div>

      {/* Period toggle */}
      <div className="tabs">
        {[
          { key: 'today' as const, label: 'Today' },
          { key: 'week' as const, label: 'This Week' },
          { key: 'month' as const, label: 'This Month' },
        ].map((p) => (
          <button
            key={p.key}
            className={`tab ${period === p.key ? 'active' : ''}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid-3 section">
        {/* Me */}
        <div className="card review-card">
          <div className="avatar avatar-lg" style={{ margin: '0 auto var(--space-md)' }}>
            {me?.userAvatar ? <img src={me.userAvatar} alt={me.userName} /> : getInitials(me?.userName || 'You')}
          </div>
          <div className="review-value">{getRate(me)}%</div>
          <div className="review-label">Your completion rate</div>
          <div className="text-sm text-muted mt-md">
            {getCompleted(me)} / {getTotal(me)} tasks
          </div>
          <div className="streak-badge mt-md" style={{ justifyContent: 'center' }}>
            <Flame size={14} /> {me?.currentStreak || 0} day streak
          </div>
        </div>

        {/* Partner */}
        {partner && (
          <div className="card review-card">
            <div className="avatar avatar-lg" style={{ margin: '0 auto var(--space-md)' }}>
              {partner.userAvatar ? <img src={partner.userAvatar} alt={partner.userName} /> : getInitials(partner.userName)}
            </div>
            <div className="review-value">{getRate(partner)}%</div>
            <div className="review-label">{partner.userName}&apos;s rate</div>
            <div className="text-sm text-muted mt-md">
              {getCompleted(partner)} / {getTotal(partner)} tasks
            </div>
            <div className="streak-badge mt-md" style={{ justifyContent: 'center' }}>
              <Flame size={14} /> {partner.currentStreak} day streak
            </div>
          </div>
        )}

        {/* Together */}
        <div className="card review-card">
          <div style={{ margin: '0 auto var(--space-md)', display: 'flex', gap: 'var(--space-xs)' }}>
            <TrendingUp size={40} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="review-value">
            {getCompleted(me) + getCompleted(partner)}
          </div>
          <div className="review-label">Tasks together</div>
          <div className="text-sm text-muted mt-md">
            {getAccountabilityMessage(getRate(me), getRate(partner))}
          </div>
        </div>
      </div>

      {/* Accountability comparison */}
      {partner && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              <TrendingUp size={18} /> Accountability
            </h2>
          </div>
          <div className="card">
            <div className="accountability-grid">
              <div className="accountability-card">
                <div className="accountability-rate">{getRate(me)}%</div>
                <div className="accountability-label">You</div>
                <div className="progress-bar mt-md">
                  <div className="progress-bar-fill" style={{ width: `${getRate(me)}%` }} />
                </div>
              </div>
              <div className="accountability-card">
                <div className="accountability-rate">{getRate(partner)}%</div>
                <div className="accountability-label">{partner.userName}</div>
                <div className="progress-bar mt-md">
                  <div className="progress-bar-fill" style={{ width: `${getRate(partner)}%` }} />
                </div>
              </div>
              <div className="accountability-message">
                {getAccountabilityMessage(getRate(me), getRate(partner))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Calendar Heatmap */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <Calendar size={18} /> Activity History
          </h2>
        </div>
        <div className="card">
          <p className="text-sm text-muted mb-lg">Last 90 days</p>
          <div className="calendar-heatmap">
            {heatmapDays.map((day) => (
              <div
                key={day.date}
                className={`heatmap-cell level-${day.level}`}
                title={`${day.date}: ${day.count} task${day.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-sm mt-md" style={{ justifyContent: 'flex-end' }}>
            <span className="text-xs text-muted">Less</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <div key={l} className={`heatmap-cell level-${l}`} />
            ))}
            <span className="text-xs text-muted">More</span>
          </div>
        </div>
      </section>
    </div>
  )
}
