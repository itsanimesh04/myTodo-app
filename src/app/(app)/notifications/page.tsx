'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Bell,
  CheckCircle2,
  Target,
  Users,
  AlertCircle,
  BarChart3,
  Check,
  Trash2,
} from 'lucide-react'
import type { NotificationItem } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  task_reminder: AlertCircle,
  partner_completed: CheckCircle2,
  target_reached: Target,
  weekly_review: BarChart3,
  overdue: AlertCircle,
  member_joined: Users,
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function markAllRead() {
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (e) {
      console.error('Failed to mark as read:', e)
    }
  }

  async function deleteNotification(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (e) {
      console.error('Failed to delete notification:', e)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <h1 className="page-title">
          Notifications
          {unreadCount > 0 && (
            <span className="section-badge" style={{ marginLeft: 'var(--space-sm)' }}>
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="card">
          {[1, 2, 3].map((i) => (
            <div key={i} className="notification-item">
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)' }}></div>
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '70%', height: 14 }}></div>
                <div className="skeleton skeleton-text mt-sm" style={{ width: '50%', height: 12 }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Bell className="empty-state-icon" />
            <p className="empty-state-title">All caught up!</p>
            <p className="empty-state-description">
              You&apos;ll be notified when your partner completes tasks, targets are reached, and more.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          {notifications.map((notif) => {
            const Icon = ICON_MAP[notif.type] || Bell
            return (
              <div
                key={notif.id}
                className={`notification-item ${!notif.read ? 'unread' : ''}`}
              >
                <div className={`notification-icon-wrapper ${notif.type}`}>
                  <Icon size={18} />
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.message}</div>
                  <div className="notification-time">
                    {formatNotificationTime(notif.createdAt)}
                  </div>
                </div>
                <div className="notification-actions">
                  {!notif.read && (
                    <div className="notification-unread-dot" title="Unread" />
                  )}
                  <button
                    className="btn-icon"
                    onClick={() => deleteNotification(notif.id)}
                    aria-label="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatNotificationTime(dateStr: string): string {
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
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
