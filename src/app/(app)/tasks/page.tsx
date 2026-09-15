'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus,
  Trash2,
  Clock,
  Eye,
  EyeOff,
  Calendar,
  X,
} from 'lucide-react'
import { isOverdue, getInitials } from '@/lib/utils'
import { TASK_PRIORITIES, RECURRING_OPTIONS, DAYS_OF_WEEK, VISIBILITY_OPTIONS } from '@/lib/constants'
import { useRealTime } from '@/hooks/useRealTime'
import type { TaskWithUser } from '@/types'

type Filter = 'today' | 'upcoming' | 'completed' | 'all'

export default function TasksPage() {
  const { data: session } = useSession()
  const user = session?.user

  const [tasks, setTasks] = useState<TaskWithUser[]>([])
  const [filter, setFilter] = useState<Filter>('today')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState('none')
  const [visibility, setVisibility] = useState('shared')
  const [recurringFreq, setRecurringFreq] = useState('')
  const [customDays, setCustomDays] = useState<number[]>([])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?filter=${filter}`)
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (e) {
      console.error('Failed to fetch tasks:', e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchTasks()
  }, [fetchTasks])

  useRealTime({
    task_updated: () => fetchTasks(),
    task_completed: () => fetchTasks(),
  })

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const body: Record<string, unknown> = {
      title: title.trim(),
      priority,
      visibility,
    }

    if (dueAt) body.dueAt = new Date(dueAt).toISOString()

    if (recurringFreq) {
      body.recurringRule = {
        frequency: recurringFreq,
        ...(recurringFreq === 'custom' && customDays.length > 0 ? { days: customDays } : {}),
      }
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        resetForm()
        setShowModal(false)
        fetchTasks()
      }
    } catch (e) {
      console.error('Failed to create task:', e)
    }
  }

  function resetForm() {
    setTitle('')
    setDueAt('')
    setPriority('none')
    setVisibility('shared')
    setRecurringFreq('')
    setCustomDays([])
  }

  async function toggleTask(taskId: string, completed: boolean) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: completed ? 'pending' : 'completed' }),
      })
      fetchTasks()
    } catch (e) {
      console.error('Failed to toggle task:', e)
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      fetchTasks()
    } catch (e) {
      console.error('Failed to delete task:', e)
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <h1 className="page-title">Tasks</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="tabs">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="card">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="task-item">
              <div className="skeleton" style={{ width: 22, height: 22, borderRadius: 6 }}></div>
              <div className="skeleton skeleton-text" style={{ flex: 1, height: 16 }}></div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Calendar className="empty-state-icon" />
            <p className="empty-state-title">
              {filter === 'today' ? 'Nothing planned for today' :
               filter === 'upcoming' ? 'No upcoming tasks' :
               filter === 'completed' ? 'No completed tasks yet' :
               'No tasks yet'}
            </p>
            <p className="empty-state-description">
              {filter === 'today' ? 'Add a task to get started with your day.' :
               'Create a task to stay organized.'}
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          {tasks.map((task) => (
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
                    />
                  )}
                  {task.visibility === 'private' && (
                    <span className="task-tag"><EyeOff size={10} /> Private</span>
                  )}
                  {task.dueAt && isOverdue(task.dueAt) && task.status !== 'completed' && (
                    <span className="task-tag overdue"><Clock size={10} /> Overdue</span>
                  )}
                  {task.recurringRule && (
                    <span className="task-tag">🔄 Recurring</span>
                  )}
                </div>
              </div>
              <div className="task-actions">
                <button
                  className="btn-icon"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete "${task.title}"`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Task</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="task-title">Task</label>
                  <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What do you need to do?"
                    required
                    autoFocus
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-due">Due date</label>
                  <input
                    id="task-due"
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="task-visibility">Visibility</label>
                  <select
                    id="task-visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    {VISIBILITY_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>{v.label} — {v.description}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="task-recurring">Repeat</label>
                  <select
                    id="task-recurring"
                    value={recurringFreq}
                    onChange={(e) => setRecurringFreq(e.target.value)}
                  >
                    <option value="">No repeat</option>
                    {RECURRING_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {recurringFreq === 'custom' && (
                  <div className="form-group">
                    <label>Days</label>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                      {DAYS_OF_WEEK.map((day, i) => (
                        <button
                          key={day}
                          type="button"
                          className={`btn btn-sm ${customDays.includes(i) ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            setCustomDays((prev) =>
                              prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
                            )
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
