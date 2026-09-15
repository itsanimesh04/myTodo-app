'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, CheckCircle2, Target, X } from 'lucide-react'
import { getInitials, getPeriodLabel } from '@/lib/utils'
import { TARGET_PERIODS } from '@/lib/constants'
import type { TargetWithUser } from '@/types'

export default function TargetsPage() {
  const { data: session } = useSession()
  const user = session?.user

  const [targets, setTargets] = useState<TargetWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'mine' | 'partner'>('mine')

  // Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetValue, setTargetValue] = useState(10)
  const [period, setPeriod] = useState('weekly')
  const [targetType, setTargetType] = useState('tasks_completed')

  const fetchTargets = useCallback(async () => {
    try {
      const res = await fetch('/api/targets')
      const data = await res.json()
      setTargets(data.targets || [])
    } catch (e) {
      console.error('Failed to fetch targets:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTargets()
  }, [fetchTargets])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || undefined, targetValue, period, targetType }),
      })
      if (res.ok) {
        setTitle('')
        setDescription('')
        setTargetValue(10)
        setPeriod('weekly')
        setShowModal(false)
        fetchTargets()
      }
    } catch (e) {
      console.error('Failed to create target:', e)
    }
  }

  async function deleteTarget(id: string) {
    if (!confirm('Delete this target?')) return
    try {
      await fetch(`/api/targets/${id}`, { method: 'DELETE' })
      fetchTargets()
    } catch (e) {
      console.error('Failed to delete target:', e)
    }
  }

  const userId = (user as Record<string, unknown>)?.id
  const myTargets = targets.filter((t) => t.userId === userId)
  const partnerTargets = targets.filter((t) => t.userId !== userId)
  const displayTargets = activeTab === 'mine' ? myTargets : partnerTargets

  const now = new Date()

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <h1 className="page-title">Targets</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Target
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'mine' ? 'active' : ''}`} onClick={() => setActiveTab('mine')}>
          My Targets
        </button>
        <button className={`tab ${activeTab === 'partner' ? 'active' : ''}`} onClick={() => setActiveTab('partner')}>
          Partner&apos;s Targets
        </button>
      </div>

      {loading ? (
        <div className="grid-2">
          {[1, 2].map((i) => (
            <div key={i} className="card skeleton skeleton-card"></div>
          ))}
        </div>
      ) : displayTargets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Target className="empty-state-icon" />
            <p className="empty-state-title">
              {activeTab === 'mine' ? 'Give yourself something to aim for' : 'No partner targets yet'}
            </p>
            <p className="empty-state-description">
              {activeTab === 'mine' ? 'Create your first weekly target.' : 'Your partner hasn\'t set any targets yet.'}
            </p>
            {activeTab === 'mine' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Create Target
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {displayTargets.map((target) => {
            const pct = Math.min(100, Math.round((target.currentValue / target.targetValue) * 100))
            const isComplete = target.currentValue >= target.targetValue
            const isActive = new Date(target.startDate) <= now && new Date(target.endDate) >= now
            const isExpired = new Date(target.endDate) < now

            return (
              <div key={target.id} className="card target-card">
                <div className="target-header">
                  <div>
                    <div className="target-title">{target.title}</div>
                    {target.description && (
                      <p className="text-sm text-muted mt-sm">{target.description}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <span className="target-period">{getPeriodLabel(target.period)}</span>
                    {activeTab === 'mine' && (
                      <button className="btn-icon" onClick={() => deleteTarget(target.id)} aria-label="Delete target">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="target-progress">
                  <div className="target-progress-text">
                    <span className="target-progress-value">
                      {target.currentValue} / {target.targetValue}
                    </span>
                    <span className="target-progress-pct">{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${isComplete ? 'complete' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isComplete && (
                    <div className="target-complete-badge" style={{ animation: 'celebrate 0.5s ease' }}>
                      <CheckCircle2 size={14} />
                      Target completed!
                    </div>
                  )}
                  {isExpired && !isComplete && (
                    <p className="text-sm text-muted mt-sm">This target period has ended.</p>
                  )}
                </div>

                {activeTab === 'partner' && (
                  <div className="flex items-center gap-sm mt-lg">
                    <div className="avatar avatar-sm">
                      {target.user.avatar ? (
                        <img src={target.user.avatar} alt={target.user.name} />
                      ) : (
                        getInitials(target.user.name)
                      )}
                    </div>
                    <span className="text-sm">{target.user.name}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Target</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="target-title">What&apos;s your goal?</label>
                  <input
                    id="target-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Complete 20 tasks"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="target-desc">Description (optional)</label>
                  <input
                    id="target-desc"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Any extra details"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="target-value">Target number</label>
                  <input
                    id="target-value"
                    type="number"
                    min={1}
                    max={10000}
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="target-period">Period</label>
                  <select
                    id="target-period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    {TARGET_PERIODS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="target-type">Tracking type</label>
                  <select
                    id="target-type"
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                  >
                    <option value="tasks_completed">Tasks completed (auto-tracked)</option>
                    <option value="custom_count">Custom count (manual)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Target</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
