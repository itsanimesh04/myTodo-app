'use client'

import { useEffect, useRef, useCallback } from 'react'

type EventHandler = (data: Record<string, unknown>) => void

export function useRealTime(
  handlers: Record<string, EventHandler>,
  options?: { enabled?: boolean; debounceMs?: number }
) {
  const handlersRef = useRef(handlers)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingEventsRef = useRef<Set<string>>(new Set())

  const enabled = options?.enabled ?? true
  const debounceMs = options?.debounceMs ?? 300

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  // Debounced flush: calls each unique handler that fired during the debounce window
  const flushPendingEvents = useCallback(() => {
    const events = new Set(pendingEventsRef.current)
    pendingEventsRef.current.clear()

    for (const eventType of events) {
      const handler = handlersRef.current[eventType]
      if (handler) {
        handler({})
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let eventSource: EventSource | null = null
    let retryTimeout: NodeJS.Timeout | null = null
    let retryCount = 0

    function connect() {
      eventSource = new EventSource('/api/sse')

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)

          // Ignore non-actionable events
          if (parsed.type === 'connected' || parsed.type === 'no_house') return

          const handler = handlersRef.current[parsed.type]
          if (handler !== undefined) {
            // Debounce: collect event types and flush after delay
            pendingEventsRef.current.add(parsed.type)

            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current)
            }
            debounceTimerRef.current = setTimeout(flushPendingEvents, debounceMs)
          }
        } catch {
          // ignore parse errors (keepalive)
        }
      }

      eventSource.onopen = () => {
        retryCount = 0
      }

      eventSource.onerror = () => {
        eventSource?.close()
        // Exponential backoff with higher minimum
        const delay = Math.min(2000 * Math.pow(2, retryCount), 60000)
        retryCount++
        retryTimeout = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      eventSource?.close()
      if (retryTimeout) clearTimeout(retryTimeout)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [enabled, debounceMs, flushPendingEvents])
}
