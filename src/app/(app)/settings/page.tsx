'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Settings, User, Palette, Bell, Home, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useToast } from '@/components/ui/ToastProvider'
import { getInitials } from '@/lib/utils'

type Tab = 'account' | 'appearance' | 'notifications' | 'house'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  const user = session?.user

  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  // Notification preferences (persisted in localStorage)
  const [notifTaskReminders, setNotifTaskReminders] = useState(true)
  const [notifPartnerActivity, setNotifPartnerActivity] = useState(true)
  const [notifTargetAchievements, setNotifTargetAchievements] = useState(true)
  const [notifWeeklyReview, setNotifWeeklyReview] = useState(true)

  // Load notification preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notif_preferences')
      if (saved) {
        const prefs = JSON.parse(saved)
        if (prefs.taskReminders !== undefined) setNotifTaskReminders(prefs.taskReminders)
        if (prefs.partnerActivity !== undefined) setNotifPartnerActivity(prefs.partnerActivity)
        if (prefs.targetAchievements !== undefined) setNotifTargetAchievements(prefs.targetAchievements)
        if (prefs.weeklyReview !== undefined) setNotifWeeklyReview(prefs.weeklyReview)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // Save notification preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notif_preferences', JSON.stringify({
      taskReminders: notifTaskReminders,
      partnerActivity: notifPartnerActivity,
      targetAchievements: notifTargetAchievements,
      weeklyReview: notifWeeklyReview,
    }))
  }, [notifTaskReminders, notifPartnerActivity, notifTargetAchievements, notifWeeklyReview])

  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (res.ok) {
        addToast('Profile updated')
        update({ name: name.trim() })
      } else {
        addToast('Failed to update profile', 'error')
      }
    } catch {
      addToast('Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: 'account', label: 'Account', icon: User },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account */}
      {activeTab === 'account' && (
        <div className="card">
          <div className="settings-section">
            <h3>Profile</h3>

            <div className="flex items-center gap-xl mb-xl">
              <div className="avatar avatar-xl">
                {user?.image ? (
                  <img src={user.image} alt={user.name || ''} />
                ) : (
                  getInitials(user?.name || 'U')
                )}
              </div>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group mb-lg">
                <label htmlFor="settings-name">Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="form-group mb-xl">
                <label>Email</label>
                <input type="email" value={user?.email || ''} disabled />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          <div className="settings-section" style={{ marginTop: 'var(--space-2xl)' }}>
            <h3>Account Actions</h3>
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--color-danger)' }}
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Appearance */}
      {activeTab === 'appearance' && (
        <div className="card">
          <div className="settings-section">
            <h3>Theme</h3>
            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Color theme</div>
                <div className="settings-row-description">Choose between light, dark, or system preference</div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="card">
          <div className="settings-section">
            <h3>Notification Preferences</h3>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Task reminders</div>
                <div className="settings-row-description">Get notified about upcoming and overdue tasks</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifTaskReminders}
                  onChange={(e) => setNotifTaskReminders(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Partner activity</div>
                <div className="settings-row-description">When your partner completes tasks</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifPartnerActivity}
                  onChange={(e) => setNotifPartnerActivity(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Target achievements</div>
                <div className="settings-row-description">When you or your partner reach a target</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifTargetAchievements}
                  onChange={(e) => setNotifTargetAchievements(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Weekly review</div>
                <div className="settings-row-description">Weekly summary of your progress</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifWeeklyReview}
                  onChange={(e) => setNotifWeeklyReview(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
