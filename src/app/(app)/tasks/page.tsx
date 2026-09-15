'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus,
  Trash2,
  Edit2,
  Clock,
  EyeOff,
  Calendar,
  X,
  MoreVertical,
  Users2,
  Repeat,
} from 'lucide-react'
import { isOverdue } from '@/lib/utils'
import { TASK_PRIORITIES, DAYS_OF_WEEK, VISIBILITY_OPTIONS } from '@/lib/constants'
import { getTagInfo, PREDEFINED_TAGS } from '@/lib/catAvatars'
import { useToast } from '@/components/ui/ToastProvider'
import { useRealTime } from '@/hooks/useRealTime'
import type { TaskWithUser } from '@/types'

type Filter = 'today' | 'upcoming' | 'completed' | 'all'

export default function TasksPage() {
  const { data: session } = useSession()
  const user = session?.user
  const { addToast } = useToast()

  const [tasks, setTasks] = useState<TaskWithUser[]>([])
  const [filter, setFilter] = useState<Filter>('today')
  const [loading, setLoading] = useState(true)

  // Fast Quick Add bar
  const [quickTitle, setQuickTitle] = useState('')
  const [quickSubmitting, setQuickSubmitting] = useState(false)

  // Full Create Modal State
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('')
  const [customTagInput, setCustomTagInput] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState('none')
  const [visibility, setVisibility] = useState('shared')
  const [isCombined, setIsCombined] = useState(false)
  const [repeatType, setRepeatType] = useState('none')
  const [customDays, setCustomDays] = useState<number[]>([])

  // 3-Dots Menu & Edit Modal State
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<TaskWithUser | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTag, setEditTag] = useState('')
  const [editPriority, setEditPriority] = useState('none')
  const [editDueAt, setEditDueAt] = useState('')
  const [editIsCombined, setEditIsCombined] = useState(false)
  const [editRepeatType, setEditRepeatType] = useState('none')
  const [editRepeatDays, setEditRepeatDays] = useState<number[]>([])

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

  // Fast quick add at top
  async function handleFastAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickTitle.trim() || quickSubmitting) return

    setQuickSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle.trim(),
          dueAt: filter === 'today' ? new Date().toISOString() : null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setQuickTitle('')
        addToast('Task added!')
        fetchTasks()
      } else {
        addToast(data.error || 'Failed to create task', 'error')
      }
    } catch (e) {
      console.error('Failed to add task:', e)
      addToast('Error creating task', 'error')
    } finally {
      setQuickSubmitting(false)
    }
  }

  // Full task creation
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const effectiveTag = tag === 'other' ? customTagInput.trim() : tag

    const body: Record<string, unknown> = {
      title: title.trim(),
      priority,
      visibility: isCombined ? 'shared' : visibility,
      tag: effectiveTag || null,
      isCombined,
      repeatType: repeatType !== 'none' ? repeatType : null,
      repeatDays: repeatType === 'custom' ? customDays : [],
    }

    if (dueAt) body.dueAt = new Date(dueAt).toISOString()

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        resetForm()
        setShowModal(false)
        addToast(isCombined ? 'Combined task created!' : 'Task created!')
        fetchTasks()
      } else {
        addToast(data.error || 'Failed to create task', 'error')
      }
    } catch (e) {
      console.error('Failed to create task:', e)
      addToast('Error creating task', 'error')
    }
  }

  function resetForm() {
    setTitle('')
    setTag('')
    setCustomTagInput('')
    setDueAt('')
    setPriority('none')
    setVisibility('shared')
    setIsCombined(false)
    setRepeatType('none')
    setCustomDays([])
  }

  async function toggleTask(task: TaskWithUser) {
    const isUserDone = task.isCombined
      ? task.completedBy?.includes(user?.id || '')
      : task.status === 'completed'

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: isUserDone ? 'pending' : 'completed' }),
      })
      fetchTasks()
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
    setEditRepeatType(task.repeatType || 'none')
    setEditRepeatDays(task.repeatDays || [])
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
          repeatType: editRepeatType !== 'none' ? editRepeatType : null,
          repeatDays: editRepeatType === 'custom' ? editRepeatDays : [],
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
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Fast Quick-Add bar for mobile & desktop */}
      <form onSubmit={handleFastAdd} className="mb-lg">
        <div className="quick-task">
          <Plus size={18} className="quick-task-icon" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add task... (tap Add or press enter)"
            aria-label="Quick add task"
          />
          <button
            type="submit"
            className="quick-add-btn"
            disabled={!quickTitle.trim() || quickSubmitting}
            aria-label="Add task"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </form>

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
          {tasks.map((task) => {
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
                      <span className="combined-badge" title="Both partners must complete this task">
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
                          ? '🎉 Done together'
                          : `${(task.completedBy || []).length}/2 completed · Both must finish`}
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
                      />
                    )}

                    {task.visibility === 'private' && (
                      <span className="task-tag"><EyeOff size={10} /> Private</span>
                    )}

                    {task.dueAt && isOverdue(task.dueAt) && task.status !== 'completed' && (
                      <span className="task-tag overdue"><Clock size={10} /> Overdue</span>
                    )}

                    {task.repeatType && task.repeatType !== 'none' && (
                      <span className="task-tag">
                        <Repeat size={10} /> Repeats (30d)
                      </span>
                    )}
                  </div>
                </div>

                {/* 3-Dots Action Menu on the opposite side */}
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
                  <label htmlFor="task-title">Task Title</label>
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

                {/* Tags */}
                <div className="form-group">
                  <label>Tag (Predefined or Custom)</label>
                  <div className="tag-selector">
                    {PREDEFINED_TAGS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`tag-selector-btn ${tag === t.label ? 'selected' : ''}`}
                        onClick={() => setTag(tag === t.label ? '' : t.label)}
                      >
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`tag-selector-btn ${tag === 'other' ? 'selected' : ''}`}
                      onClick={() => setTag(tag === 'other' ? '' : 'other')}
                    >
                      <span>🏷️</span> Other
                    </button>
                  </div>

                  {tag === 'other' && (
                    <div className="mt-xs">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="Type custom tag name (e.g. Reading, Gym)..."
                        maxLength={30}
                      />
                    </div>
                  )}
                </div>

                {/* Combined / Dual Accountability Task */}
                <div className="form-group">
                  <label className="flex items-center gap-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCombined}
                      onChange={(e) => setIsCombined(e.target.checked)}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                    <span className="font-medium">
                      Combined Task (Both must complete — agar koi ek miss kare to nahi count hoga)
                    </span>
                  </label>
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

                {!isCombined && (
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
                )}

                {/* Repeat Feature (Up to 30 days) */}
                <div className="form-group">
                  <label htmlFor="task-repeat">Repeat (Next 30 Days)</label>
                  <select
                    id="task-repeat"
                    value={repeatType}
                    onChange={(e) => setRepeatType(e.target.value)}
                  >
                    <option value="none">No repeat</option>
                    <option value="daily">Daily (next 30 days)</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                    <option value="custom">Choose specific day(s) (e.g. Sunday planning)</option>
                  </select>
                </div>

                {repeatType === 'custom' && (
                  <div className="form-group">
                    <label>Select Days of the Week</label>
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
                  <label htmlFor="edit-title">Task Title</label>
                  <input
                    id="edit-title"
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
                      placeholder="Or custom tag..."
                      maxLength={30}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="flex items-center gap-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsCombined}
                      onChange={(e) => setEditIsCombined(e.target.checked)}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                    <span className="font-medium">Combined Task (Both partners required)</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-priority">Priority</label>
                  <select
                    id="edit-priority"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-due">Due date</label>
                  <input
                    id="edit-due"
                    type="datetime-local"
                    value={editDueAt}
                    onChange={(e) => setEditDueAt(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-repeat">Repeat (Next 30 Days)</label>
                  <select
                    id="edit-repeat"
                    value={editRepeatType}
                    onChange={(e) => setEditRepeatType(e.target.value)}
                  >
                    <option value="none">No repeat</option>
                    <option value="daily">Daily (30 days)</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="custom">Choose specific days</option>
                  </select>
                </div>

                {editRepeatType === 'custom' && (
                  <div className="form-group">
                    <label>Select Days</label>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                      {DAYS_OF_WEEK.map((day, i) => (
                        <button
                          key={day}
                          type="button"
                          className={`btn btn-sm ${editRepeatDays.includes(i) ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            setEditRepeatDays((prev) =>
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
