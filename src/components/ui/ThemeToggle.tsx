'use client'

import { useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolved, setResolved] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) || 'system'
    setThemeState(stored)
    const resolved = stored === 'system' ? getSystemTheme() : stored
    setResolved(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        const r = getSystemTheme()
        setResolved(r)
        document.documentElement.setAttribute('data-theme', r)
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    const r = newTheme === 'system' ? getSystemTheme() : newTheme
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
  }, [])

  return { theme, resolved, setTheme }
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-pills" role="radiogroup" aria-label="Theme selection">
      {(['light', 'dark', 'system'] as Theme[]).map((t) => (
        <button
          key={t}
          className={`theme-pill ${theme === t ? 'active' : ''}`}
          onClick={() => setTheme(t)}
          role="radio"
          aria-checked={theme === t}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  )
}
