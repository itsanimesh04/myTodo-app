'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Copy, RefreshCw, LogOut, Crown, Check } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useToast } from '@/components/ui/ToastProvider'
import type { HouseWithMembers } from '@/types'

export default function HousePage() {
  const { data: session, update } = useSession()
  const { addToast } = useToast()
  const user = session?.user

  const [house, setHouse] = useState<HouseWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchHouse = useCallback(async () => {
    try {
      const res = await fetch('/api/house')
      const data = await res.json()
      setHouse(data.house)
    } catch (e) {
      console.error('Failed to fetch house:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHouse()
  }, [fetchHouse])

  async function copyInviteCode() {
    if (!house) return
    try {
      await navigator.clipboard.writeText(house.inviteCode)
      setCopied(true)
      addToast('Invite code copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      addToast('Failed to copy', 'error')
    }
  }

  async function regenerateCode() {
    try {
      const res = await fetch('/api/house/invite', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setHouse((prev) => prev ? { ...prev, inviteCode: data.inviteCode } : prev)
        addToast('New invite code generated')
      }
    } catch {
      addToast('Failed to regenerate code', 'error')
    }
  }

  async function updateHouseName() {
    if (!newName.trim()) return
    try {
      const res = await fetch('/api/house', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setHouse(data.house)
        setEditingName(false)
        addToast('House name updated')
        update({ houseName: newName.trim() })
      }
    } catch {
      addToast('Failed to update name', 'error')
    }
  }

  async function leaveHouse() {
    if (!confirm('Are you sure you want to leave this house? This cannot be undone.')) return
    try {
      const res = await fetch('/api/house', { method: 'DELETE' })
      if (res.ok) {
        setHouse(null)
        addToast('You have left the house')
        update({ houseId: null, houseName: null })
      }
    } catch {
      addToast('Failed to leave house', 'error')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">House</h1></div>
        <div className="card skeleton skeleton-card" style={{ height: 200 }}></div>
      </div>
    )
  }

  if (!house) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">House</h1></div>
        <div className="card">
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <p className="empty-state-title">You&apos;re not in a house yet</p>
            <p className="empty-state-description">Create or join a house from the onboarding page.</p>
            <a href="/onboarding" className="btn btn-primary btn-sm">Get Started</a>
          </div>
        </div>
      </div>
    )
  }

  const isOwner = house.ownerId === user?.id
  const isFull = house.members.length >= 2

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">House</h1>
      </div>

      {/* House Info */}
      <section className="section">
        <div className="card">
          <div className="flex items-center justify-between mb-xl">
            {editingName ? (
              <div className="flex items-center gap-sm">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="House name"
                  maxLength={50}
                  autoFocus
                  style={{ width: 200 }}
                />
                <button className="btn btn-primary btn-sm" onClick={updateHouseName}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}>Cancel</button>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  {house.name}
                </h2>
                {isOwner && (
                  <button
                    className="text-sm text-accent"
                    onClick={() => { setEditingName(true); setNewName(house.name) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                  >
                    Rename
                  </button>
                )}
              </div>
            )}
            <span className="text-sm text-muted">{house.members.length}/2 members</span>
          </div>

          {/* Members */}
          <div className="flex flex-col gap-lg">
            {house.members.map((member) => (
              <div key={member.id} className="house-member">
                <div className="avatar avatar-lg">
                  {member.user.avatar ? (
                    <img src={member.user.avatar} alt={member.user.name} />
                  ) : (
                    getInitials(member.user.name)
                  )}
                </div>
                <div className="house-member-info">
                  <div className="house-member-name">
                    {member.user.name}
                    {member.userId === house.ownerId && (
                      <Crown size={14} style={{ color: 'var(--color-warning)', marginLeft: 6, verticalAlign: 'middle' }} />
                    )}
                  </div>
                  <div className="house-member-role">
                    {member.role === 'owner' ? 'Owner' : 'Member'} · Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Invite Section */}
      {!isFull && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Invite Your Partner</h2>
          </div>

          <div className="card">
            <p className="text-sm text-muted mb-lg">
              Share this code with your accountability partner to invite them.
            </p>

            <div className="invite-code-display">
              <div className="invite-code">{house.inviteCode}</div>
            </div>

            <div className="flex gap-sm" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={copyInviteCode}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={regenerateCode}>
                <RefreshCw size={14} /> New Code
              </button>
            </div>
          </div>
        </section>
      )}

      {isFull && (
        <section className="section">
          <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
            <p className="font-medium" style={{ color: 'var(--color-accent)' }}>
              ✓ House is full
            </p>
            <p className="text-sm text-muted mt-sm">
              You and your partner are all set!
            </p>
          </div>
        </section>
      )}

      {/* Leave House */}
      <section className="section">
        <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={leaveHouse}>
          <LogOut size={16} /> Leave House
        </button>
      </section>
    </div>
  )
}
