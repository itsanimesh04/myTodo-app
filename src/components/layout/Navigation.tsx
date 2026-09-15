'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  Home,
  CheckSquare,
  Target,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { getCatAvatar } from '@/lib/catAvatars'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/targets', label: 'Targets', icon: Target },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/house', label: 'House', icon: Users },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread notification count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        const unread = (data.notifications || []).filter(
          (n: { read: boolean }) => !n.read
        ).length
        setUnreadCount(unread)
      } catch {
        // silently ignore
      }
    }

    fetchUnread()
    // Refresh every 60s
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [])

  // Reset unread count when visiting notifications page
  useEffect(() => {
    if (pathname === '/notifications') {
      setUnreadCount(0)
    }
  }, [pathname])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
            <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2>MyTodos</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <Link
            href="/notifications"
            className={`nav-item ${pathname === '/notifications' ? 'active' : ''}`}
          >
            <div className="nav-icon-wrapper">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
            <span>Notifications</span>
          </Link>

          <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>

          {user && (
            <div className="sidebar-user">
              <div className="avatar avatar-sm">
                <img src={getCatAvatar(user.name, user.image)} alt={user.name || ''} />
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-email">{user.email}</div>
              </div>
              <button
                className="btn-icon"
                onClick={() => signOut({ callbackUrl: '/login' })}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <div className="mobile-nav-items">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <Link
            href="/notifications"
            className={`mobile-nav-item ${pathname === '/notifications' ? 'active' : ''}`}
          >
            <div className="nav-icon-wrapper">
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
            <span>Alerts</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
