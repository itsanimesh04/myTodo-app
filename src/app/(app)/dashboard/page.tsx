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
  MoreVertical,
  Edit2,
  Trash2,
  Star,
  Users2,
  X,
  Tag as TagIcon,
} from 'lucide-react'
import { getGreeting, formatDate, isOverdue, getAccountabilityMessage } from '@/lib/utils'
import { MOTIVATIONAL_SUBTITLES, REACTION_TYPES, TASK_PRIORITIES } from '@/lib/constants'
import { getCatAvatar, getTagInfo, PREDEFINED_TAGS } from '@/lib/catAvatars'
import { useToast } from '@/components/ui/ToastProvider'
import { useRealTime } from '@/hooks/useRealTime'
import type { TaskWithUser, ActivityWithDetails, TargetWithUser, MemberStreakScore } from '@/types'

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user
  const houseId = user?.houseId
  const { addToast } = useToast()

  const [myTasks, setMyTasks] = useState<TaskWithUser[]>([])
  const [partnerTasks, setPartnerTasks] = useState<TaskWithUser[]>([])
  const [activities, setActivities] = useState<ActivityWithDetails[]>([])
  const [targets, setTargets] = useState<TargetWithUser[]>([])
  const [house, setHouse] = useState<any>(null)
  const [partnerUser, setPartnerUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null)
  const [streak, setStreak] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [myAvatar, setMyAvatar] = useState<string | null>(null)
  const [partnerScore, setPartnerScore] = useState(0)
  const [partnerStreak, setPartnerStreak] = useState(0)
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Quick Add Form State
  const [newTask, setNewTask] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [isCombinedTask, setIsCombinedTask] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 3-Dots Menu & Edit Modal State
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<TaskWithUser | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTag, setEditTag] = useState('')
  const [editPriority, setEditPriority] = useState('none')
  const [editDueAt, setEditDueAt] = useState('')
  const [editIsCombined, setEditIsCombined] = useState(false)

  const subtitle = MOTIVATIONAL_SUBTITLES[
    new Date().getDate() % MOTIVATIONAL_SUBTITLES.length
  ]

  // Close 3-dots menu on outside click
  useEffect(() => {
    function handleClickOutside() {
      setActiveMenuTaskId(null)
    }
    if (activeMenuTaskId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeMenuTaskId])

  const fetchHouse = useCallback(async () => {
    try {
      const res = await fetch('/api/house')
      if (res.ok) {
        const data = await res.json()
        setHouse(data.house)
        if (data.house?.members) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const meMember = data.house.members.find((m: any) => m.userId === user?.id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const partnerMember = data.house.members.find((m: any) => m.userId !== user?.id)

          if (meMember?.user?.avatar) {
            setMyAvatar(meMember.user.avatar)
          }
          if (partnerMember?.user) {
            setPartnerUser(partnerMember.user)
            if (partnerMember.user.avatar) {
              setPartnerAvatar(partnerMember.user.avatar)
            }
          } else {
            setPartnerUser(null)
            setPartnerAvatar(null)
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch house:', e)
    }
  }, [user?.id])

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

  const fetchStreakAndScores = useCallback(async () => {
    try {
      const res = await fetch('/api/progress?fields=streak')
      const data = await res.json()
      if (data.stats?.members) {
        const members: MemberStreakScore[] = data.stats.members
        const me = members.find((m) => m.userId === user?.id)
        if (me) {
          setStreak(me.currentStreak)
          setMyScore(me.score || 0)
          if (me.userAvatar) setMyAvatar(me.userAvatar)
        }
        const partner = members.find((m) => m.userId !== user?.id)
        if (partner) {
          setPartnerStreak(partner.currentStreak)
          setPartnerScore(partner.score || 0)
          if (partner.userAvatar) setPartnerAvatar(partner.userAvatar)
          if (partner.userName) {
            setPartnerUser((prev) =>
              prev
                ? { ...prev, name: partner.userName, avatar: partner.userAvatar ?? prev.avatar }
                : { id: partner.userId, name: partner.userName, avatar: partner.userAvatar ?? null }
            )
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch streak & scores:', e)
    }
  }, [user?.id])

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/user')
      if (res.ok) {
        const data = await res.json()
        if (data.user?.avatar) setMyAvatar(data.user.avatar)
      }
    } catch {
      // silently ignore
    }
  }, [])

  // Initial load
  useEffect(() => {
    async function loadAll() {
      await Promise.all([
        fetchUser(),
        fetchHouse(),
        fetchTasks(),
        fetchActivity(),
        fetchTargets(),
        fetchStreakAndScores(),
      ])
      setLoading(false)
    }
    loadAll()
  }, [fetchUser, fetchHouse, fetchTasks, fetchActivity, fetchTargets, fetchStreakAndScores])

  // Real-time updates
  useRealTime(
    {
      task_updated: () => fetchTasks(),
      task_completed: () => {
        fetchTasks()
        fetchStreakAndScores()
      },
      target_updated: () => fetchTargets(),
      activity_new: () => fetchActivity(),
      reaction_new: () => fetchActivity(),
    },
    { enabled: !!houseId, debounceMs: 400 }
  )

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.trim(),
          dueAt: new Date().toISOString(),
          tag: selectedTag || null,
          isCombined: isCombinedTask,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setNewTask('')
        setSelectedTag('')
        setIsCombinedTask(false)
        addToast(isCombinedTask ? 'Combined task added!' : 'Task added!')
        fetchTasks()
      } else {
        addToast(data.error || 'Failed to create task', 'error')
      }
    } catch (e) {
      console.error('Failed to create task:', e)
      addToast('Something went wrong. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function toggleTask(task: TaskWithUser) {
    const isUserDone = task.isCombined
      ? task.completedBy?.includes(user?.id || '')
      : task.status === 'completed'

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: isUserDone ? 'pending' : 'completed',
        }),
      })

      if (res.ok) {
        fetchTasks()
        fetchStreakAndScores()
      }
    } catch (e) {
      console.error('Failed to toggle task:', e)
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        addToast('Task deleted')
        fetchTasks()
      } else {
        const data = await res.json()
        addToast(data.error || 'Failed to delete task', 'error')
      }
    } catch (e) {
      console.error('Failed to delete task:', e)
    }
  }

  function openEditModal(task: TaskWithUser) {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditTag(task.tag || '')
    setEditPriority(task.priority || 'none')
    setEditDueAt(task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '')
    setEditIsCombined(!!task.isCombined)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTask || !editTitle.trim()) return

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          tag: editTag || null,
          priority: editPriority,
          dueAt: editDueAt ? new Date(editDueAt).toISOString() : null,
          isCombined: editIsCombined,
        }),
      })

      if (res.ok) {
        addToast('Task updated')
        setEditingTask(null)
        fetchTasks()
      } else {
        const data = await res.json()
        addToast(data.error || 'Failed to update task', 'error')
      }
    } catch (e) {
      console.error('Failed to update task:', e)
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

  const myTargets = targets.filter((t) => t.userId === user?.id)
  const activeTarget = myTargets.find((t) => {
    const now = new Date()
    return new Date(t.startDate) <= now && new Date(t.endDate) >= now
  })

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

      {/* Dual Partner Scoreboard & Cute Cat Avatars */}
      <div className="dual-scoreboard">
        {/* User Card */}
        <div className="member-score-card">
          <div className="member-cat-avatar">
            <img src={getCatAvatar(user?.name, myAvatar || user?.image)} alt={user?.name || 'You'} />
          </div>
          <div className="member-score-info">
            <div className="member-score-name">{user?.name} (You)</div>
            <div className="member-score-stats">
              <span className="stat-pill" style={{ color: 'var(--color-warning)' }}>
                <Flame size={15} /> {streak}d streak
              </span>
              <span className="stat-pill" style={{ color: 'var(--colors-link)' }}>
                <Star size={15} /> {myScore} pts
              </span>
            </div>
          </div>
        </div>

        {/* Partner Card */}
        <div className="member-score-card">
          <div className="member-cat-avatar">
            <img src={getCatAvatar(partnerUser?.name || 'Partner', partnerAvatar || partnerUser?.avatar)} alt={partnerUser?.name || 'Partner'} />
          </div>
          <div className="member-score-info">
            <div className="member-score-name">
              {partnerUser ? partnerUser.name : 'Accountability Partner'}
            </div>
            <div className="member-score-stats">
              {partnerUser ? (
                <>
                  <span className="stat-pill" style={{ color: 'var(--color-warning)' }}>
                    <Flame size={15} /> {partnerStreak}d streak
                  </span>
                  <span className="stat-pill" style={{ color: 'var(--colors-link)' }}>
                    <Star size={15} /> {partnerScore} pts
                  </span>
                </>
              ) : (
                <a href="/house" className="text-sm" style={{ color: 'var(--colors-link)', textDecoration: 'underline' }}>
                  Invite partner to link streaks!
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
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
        <div className="section-header flex justify-between items-center">
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
              <p className="empty-state-description">Add your first task and stay accountable.</p>
            </div>
          ) : (
            <div>
              {myTasks.map((task) => {
                const isUserDone = task.isCombined
                  ? task.completedBy?.includes(user?.id || '')
                  : task.status === 'completed'
                const tagInfo = getTagInfo(task.tag)

                return (
                  <div
                    key={task.id}
                    className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
                  >
                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={!!isUserDone}
                        onChange={() => toggleTask(task)}
                        aria-label={`Mark "${task.title}" as ${isUserDone ? 'pending' : 'completed'}`}
                      />
                      <div className="checkbox-visual">
                        <svg viewBox="0 0 14 14" fill="none">
                          <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>

                    <div className="task-content">
                      <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
                        <span className="task-title">{task.title}</span>
                        {task.isCombined && (
                          <span className="combined-badge" title="Both must complete this task">
                            <Users2 size={11} /> Combined
                          </span>
                        )}
                        {tagInfo && (
                          <span
                            className="tag-badge"
                            style={{
                              background: tagInfo.bg,
                              color: tagInfo.color,
                              borderColor: tagInfo.color + '40',
                            }}
                          >
                            <span>{tagInfo.emoji}</span>
                            {tagInfo.label}
                          </span>
                        )}
                      </div>

                      <div className="task-meta">
                        {task.isCombined && (
                          <span className="combined-status-badge">
                            {task.status === 'completed'
                              ? '🎉 Completed together!'
                              : `${(task.completedBy || []).length}/2 finished · Both required`}
                          </span>
                        )}

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

                    {/* 3-Dots Action Menu */}
                    <div className="task-menu-container" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`task-menu-trigger ${activeMenuTaskId === task.id ? 'active' : ''}`}
                        onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                        aria-label="Task options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuTaskId === task.id && (
                        <div className="task-menu-dropdown">
                          <button
                            type="button"
                            className="task-menu-item"
                            onClick={() => {
                              setActiveMenuTaskId(null)
                              openEditModal(task)
                            }}
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            className="task-menu-item danger"
                            onClick={() => {
                              setActiveMenuTaskId(null)
                              deleteTask(task.id)
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quick add with real phone/mobile button & tag selection */}
          <form onSubmit={handleQuickAdd} className="mt-lg">
            <div className="quick-task">
              <Plus size={18} className="quick-task-icon" />
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task for today..."
                aria-label="Quick add task"
              />
              <button
                type="submit"
                className="quick-add-btn"
                disabled={!newTask.trim() || isSubmitting}
                aria-label="Create task"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Quick Tag Selector & Combined Switch */}
            <div className="flex items-center justify-between mt-sm" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <div className="tag-selector">
                {PREDEFINED_TAGS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`tag-selector-btn ${selectedTag === t.label ? 'selected' : ''}`}
                    onClick={() => setSelectedTag(selectedTag === t.label ? '' : t.label)}
                  >
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>

              {partnerUser && (
                <label className="flex items-center gap-xs text-xs cursor-pointer" style={{ color: 'var(--colors-body)' }}>
                  <input
                    type="checkbox"
                    checked={isCombinedTask}
                    onChange={(e) => setIsCombinedTask(e.target.checked)}
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  <span>Dual/Combined Task</span>
                </label>
              )}
            </div>
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
                <img src={getCatAvatar(partnerUser.name, partnerAvatar || partnerUser.avatar)} alt={partnerUser.name} />
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
              partnerTasks.map((task) => {
                const tagInfo = getTagInfo(task.tag)
                return (
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
                      <div className="flex items-center gap-sm">
                        <span className="task-title">{task.title}</span>
                        {tagInfo && (
                          <span
                            className="tag-badge"
                            style={{
                              background: tagInfo.bg,
                              color: tagInfo.color,
                              borderColor: tagInfo.color + '40',
                            }}
                          >
                            <span>{tagInfo.emoji}</span>
                            {tagInfo.label}
                          </span>
                        )}
                      </div>

                      <div className="task-meta">
                        {task.dueAt && isOverdue(task.dueAt) && task.status !== 'completed' && (
                          <span className="task-tag overdue">
                            <Clock size={10} /> Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      )}

      {!partnerUser && (
        <section className="section">
          <div className="card">
            <div className="empty-state">
              <Sparkles className="empty-state-icon" />
              <p className="empty-state-title">Your House is waiting for your partner</p>
              <p className="empty-state-description">Invite your partner to connect streaks, scores, and shared combined to-dos!</p>
              <a href="/house" className="btn btn-primary btn-sm">Go to House & Invite</a>
            </div>
          </div>
        </section>
      )}

      {/* Accountability Rate */}
      {partnerUser && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">
              <TrendingUp size={18} />
              Accountability Synergy
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
                    <img src={getCatAvatar(activity.user.name, activity.user.avatar)} alt={activity.user.name} />
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
                    {activity.user.id !== user?.id && (
                      <div className="activity-reactions">
                        {REACTION_TYPES.map((rt) => {
                          const hasReacted = activity.reactions?.some(
                            (r) => r.userId === user?.id && r.reactionType === rt.value
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

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Task</h3>
              <button className="btn-icon" onClick={() => setEditingTask(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="edit-task-title">Task Title</label>
                  <input
                    id="edit-task-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label>Tag</label>
                  <div className="tag-selector">
                    {PREDEFINED_TAGS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`tag-selector-btn ${editTag === t.label ? 'selected' : ''}`}
                        onClick={() => setEditTag(editTag === t.label ? '' : t.label)}
                      >
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-xs">
                    <input
                      type="text"
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                      placeholder="Or type custom tag (e.g., Reading)..."
                      maxLength={30}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-task-priority">Priority</label>
                  <select
                    id="edit-task-priority"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-task-due">Due Date</label>
                  <input
                    id="edit-task-due"
                    type="datetime-local"
                    value={editDueAt}
                    onChange={(e) => setEditDueAt(e.target.value)}
                  />
                </div>

                {partnerUser && (
                  <div className="form-group">
                    <label className="flex items-center gap-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsCombined}
                        onChange={(e) => setEditIsCombined(e.target.checked)}
                        style={{ width: 'auto', height: 'auto' }}
                      />
                      <span>Combined Task (Both partners must complete to finish)</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingTask(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
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
