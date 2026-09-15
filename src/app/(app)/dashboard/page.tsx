'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { getGreeting, formatDate, isOverdue, getInitials, getAccountabilityMessage } from '@/lib/utils'
import { MOTIVATIONAL_SUBTITLES, REACTION_TYPES } from '@/lib/constants'
import { useRealTime } from '@/hooks/useRealTime'
import type { TaskWithUser, ActivityWithDetails, TargetWithUser } from '@/types'

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user
  const houseId = (user as Record<string, unknown>)?.houseId as string | null | undefined

  const [myTasks, setMyTasks] = useState<TaskWithUser[]>([])
  const [partnerTasks, setPartnerTasks] = useState<TaskWithUser[]>([])
  const [activities, setActivities] = useState<ActivityWithDetails[]>([])
  const [targets, setTargets] = useState<TargetWithUser[]>([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')

  const subtitle = MOTIVATIONAL_SUBTITLES[
    new Date().getDate() % MOTIVATIONAL_SUBTITLES.length
  ]

  const fetchTasks = useCallback(async () => {
    try {
      const [myRes, partnerRes] = await Promise.all([
        fetch('/api/tasks?filter=today'),
        fetch('/api/tasks?filter=today&partner=true'),
      ])
      const [myData, partnerData] = await Promise.all([
        myRes.json(),
        partnerRes.json(),
      ])
      setMyTasks(myData.tasks || [])
      setPartnerTasks(partnerData.tasks || [])
    } catch (e) {
      console.error('Failed to fetch tasks:', e)
    }
  }, [])

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/activity?limit=10')
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (e) {
      console.error('Failed to fetch activity:', e)
    }
  }, [])

  const fetchTargets = useCallback(async () => {
    try {
      const res = await fetch('/api/targets')
      const data = await res.json()
      setTargets(data.targets || [])
    } catch (e) {
      console.error('Failed to fetch targets:', e)
    }
  }, [])

  const fetchStreak = useCallback(async () => {
    try {
      const res = await fetch('/api/progress?fields=streak')
      const data = await res.json()
      if (data.stats?.members) {
        const me = data.stats.members.find(
          (m: { userId: string }) => m.userId === (user as Record<string, unknown>)?.id
        )
        if (me) setStreak(me.currentStreak)
      }
    } catch (e) {
      console.error('Failed to fetch streak:', e)
    }
  }, [user])

  // Initial load
  useEffect(() => {
    async function loadAll() {
      await Promise.all([fetchTasks(), fetchActivity(), fetchTargets(), fetchStreak()])
      setLoading(false)
    }
    loadAll()
  }, [fetchTasks, fetchActivity, fetchTargets, fetchStreak])

  // Real-time updates — selective refetch per event type, debounced
  useRealTime(
    {
      task_updated: () => fetchTasks(),
      task_completed: () => {
        fetchTasks()
        fetchStreak()
      },
      target_updated: () => fetchTargets(),
      activity_new: () => fetchActivity(),
      reaction_new: () => fetchActivity(),
    },
    { enabled: !!houseId, debounceMs: 400 }
  )

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.trim()) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.trim(),
          dueAt: new Date().toISOString(),
        }),
      })

      if (res.ok) {
        setNewTask('')
        fetchTasks()
      }
    } catch (e) {
      console.error('Failed to create task:', e)
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: completed ? 'pending' : 'completed',
        }),
      })
      fetchTasks()
    } catch (e) {
      console.error('Failed to toggle task:', e)
    }
  }

  async function handleReaction(activityId: string, reactionType: string) {
    try {
      await fetch(`/api/activity/${activityId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType }),
      })
      fetchActivity()
    } catch (e) {
      console.error('Failed to react:', e)
    }
  }

  const myCompleted = myTasks.filter((t) => t.status === 'completed').length
  const myTotal = myTasks.length
  const partnerCompleted = partnerTasks.filter((t) => t.status === 'completed').length
  const partnerTotal = partnerTasks.length

  const myRate = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0
  const partnerRate = partnerTotal > 0 ? Math.round((partnerCompleted / partnerTotal) * 100) : 0

  const myTargets = targets.filter((t) => t.userId === (user as Record<string, unknown>)?.id)
  const activeTarget = myTargets.find((t) => {
    const now = new Date()
    return new Date(t.startDate) <= now && new Date(t.endDate) >= now
  })

  const partnerUser = partnerTasks[0]?.user

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton skeleton-title" style={{ width: '200px', height: '32px' }}></div>
          <div className="skeleton skeleton-text mt-sm" style={{ width: '160px' }}></div>
        </div>
        <div className="stats-grid mb-xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton-card skeleton"></div>
          ))}
        </div>
        <div className="card skeleton" style={{ height: '200px' }}></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-greeting">{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
        <p className="page-subtitle">{formatDate(new Date())} · {subtitle}</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid section">
        <div className="card stat-card">
          <div className="stat-value">{myCompleted}/{myTotal}</div>
          <div className="stat-label">Tasks Today</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={20} style={{ color: 'var(--color-warning)' }} />
            {streak}
          </div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{partnerCompleted}/{partnerTotal}</div>
          <div className="stat-label">Partner Today</div>
        </div>
        {activeTarget && (
          <div className="card stat-card">
            <div className="stat-value">
              {Math.round((activeTarget.currentValue / activeTarget.targetValue) * 100)}%
            </div>
            <div className="stat-label">Weekly Target</div>
          </div>
        )}
      </div>

      {/* My Day */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            My Day
            {myTotal > 0 && (
              <span className="section-badge">{myCompleted}/{myTotal}</span>
            )}
          </h2>
        </div>

        <div className="card">
          {myTasks.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 className="empty-state-icon" />
              <p className="empty-state-title">Nothing planned yet</p>
              <p className="empty-state-description">Add your first task and get moving.</p>
            </div>
          ) : (
            <div>
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
                >
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleTask(task.id, task.status === 'completed')}
                      aria-label={`Mark "${task.title}" as ${task.status === 'completed' ? 'pending' : 'completed'}`}
                    />
                    <div className="checkbox-visual">
                      <svg viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="task-content">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta">
                      {task.priority !== 'none' && (
                        <span
                          className="task-priority-dot"
                          style={{
                            background:
                              task.priority === 'high' ? 'var(--color-priority-high)' :
                              task.priority === 'medium' ? 'var(--color-priority-medium)' :
                              'var(--color-priority-low)',
                          }}
                          title={`${task.priority} priority`}
                        />
                      )}
                      {task.dueAt && isOverdue(task.dueAt) && task.status !== 'completed' && (
                        <span className="task-tag overdue">
                          <Clock size={10} /> Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick add */}
          <form onSubmit={handleQuickAdd} className="quick-task mt-lg">
            <Plus size={18} className="quick-task-icon" />
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a task..."
              aria-label="Quick add task"
            />
          </form>
        </div>
      </section>

      {/* Partner's Day */}
      {partnerUser && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              {partnerUser.name}&apos;s Day
              {partnerTotal > 0 && (
                <span className="section-badge">{partnerCompleted}/{partnerTotal}</span>
              )}
            </h2>
          </div>

          <div className="partner-section">
            <div className="partner-header">
              <div className="avatar avatar-sm">
                {partnerUser.avatar ? (
                  <img src={partnerUser.avatar} alt={partnerUser.name} />
                ) : (
                  getInitials(partnerUser.name)
                )}
              </div>
              <div>
                <div className="partner-name">{partnerUser.name}</div>
                <div className="partner-stat">{partnerCompleted}/{partnerTotal} completed</div>
              </div>
            </div>

            {partnerTasks.length === 0 ? (
              <p className="text-sm text-muted" style={{ padding: 'var(--space-md) 0' }}>
                No tasks shared for today.
              </p>
            ) : (
              partnerTasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
                >
                  <div className="checkbox-wrapper" style={{ pointerEvents: 'none' }}>
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      readOnly
                      tabIndex={-1}
                    />
                    <div className="checkbox-visual">
                      <svg viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="task-content">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta">
                      {task.dueAt && isOverdue(task.dueAt) && task.status !== 'completed' && (
                        <span className="task-tag overdue">
                          <Clock size={10} /> Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {!partnerUser && (
        <section className="section">
          <div className="card">
            <div className="empty-state">
              <Sparkles className="empty-state-icon" />
              <p className="empty-state-title">Your House is waiting for someone</p>
              <p className="empty-state-description">Invite your accountability partner to see their progress here.</p>
              <a href="/house" className="btn btn-primary btn-sm">Go to House</a>
            </div>
          </div>
        </section>
      )}

      {/* Accountability */}
      {partnerUser && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              <TrendingUp size={18} />
              Accountability
            </h2>
          </div>

          <div className="card">
            <div className="accountability-grid">
              <div className="accountability-card">
                <div className="accountability-rate">{myRate}%</div>
                <div className="accountability-label">You</div>
              </div>
              <div className="accountability-card">
                <div className="accountability-rate">{partnerRate}%</div>
                <div className="accountability-label">{partnerUser.name}</div>
              </div>
              <div className="accountability-message">
                {getAccountabilityMessage(myRate, partnerRate)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Active Target */}
      {activeTarget && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Weekly Target</h2>
          </div>

          <div className="card target-card">
            <div className="target-header">
              <div className="target-title">{activeTarget.title}</div>
              <div className="target-period">
                {activeTarget.period === 'weekly' ? 'This Week' : activeTarget.period === 'monthly' ? 'This Month' : 'This Year'}
              </div>
            </div>
            <div className="target-progress">
              <div className="target-progress-text">
                <span className="target-progress-value">
                  {activeTarget.currentValue} / {activeTarget.targetValue}
                </span>
                <span className="target-progress-pct">
                  {Math.min(100, Math.round((activeTarget.currentValue / activeTarget.targetValue) * 100))}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${activeTarget.currentValue >= activeTarget.targetValue ? 'complete' : ''}`}
                  style={{
                    width: `${Math.min(100, (activeTarget.currentValue / activeTarget.targetValue) * 100)}%`,
                  }}
                />
              </div>
              {activeTarget.currentValue >= activeTarget.targetValue && (
                <div className="target-complete-badge">
                  <CheckCircle2 size={14} />
                  Target completed!
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
          </div>

          <div className="card">
            <div className="activity-list">
              {activities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="avatar avatar-sm">
                    {activity.user.avatar ? (
                      <img src={activity.user.avatar} alt={activity.user.name} />
                    ) : (
                      getInitials(activity.user.name)
                    )}
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>{activity.user.name}</strong>{' '}
                      {activity.type === 'task_completed' && (
                        <>completed &ldquo;{activity.task?.title || 'a task'}&rdquo;</>
                      )}
                      {activity.type === 'task_created' && (
                        <>added &ldquo;{activity.task?.title || 'a task'}&rdquo;</>
                      )}
                      {activity.type === 'target_reached' && (
                        <>reached their target: {activity.target?.title || 'a target'}</>
                      )}
                      {activity.type === 'member_joined' && (
                        <>joined the house</>
                      )}
                      {activity.type === 'house_created' && (
                        <>created the house</>
                      )}
                    </div>
                    <div className="activity-time">
                      {formatActivityTime(activity.createdAt)}
                    </div>
                    {activity.user.id !== (user as Record<string, unknown>)?.id && (
                      <div className="activity-reactions">
                        {REACTION_TYPES.map((rt) => {
                          const hasReacted = activity.reactions?.some(
                            (r) => r.userId === (user as Record<string, unknown>)?.id && r.reactionType === rt.value
                          )
                          return (
                            <button
                              key={rt.value}
                              className={`reaction-btn ${hasReacted ? 'reacted' : ''}`}
                              onClick={() => handleReaction(activity.id, rt.value)}
                            >
                              {rt.emoji} {rt.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function formatActivityTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}
