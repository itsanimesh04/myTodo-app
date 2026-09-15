// Simple in-memory event bus for SSE real-time updates
// Each house has a set of connected writers

import type { SSEEvent } from '@/types'

type SSEWriter = {
  id: string
  userId: string
  houseId: string
  writer: WritableStreamDefaultWriter<Uint8Array>
  encoder: TextEncoder
}

class EventBus {
  private connections: Map<string, SSEWriter[]> = new Map()

  addConnection(houseId: string, connection: SSEWriter) {
    const existing = this.connections.get(houseId) || []
    existing.push(connection)
    this.connections.set(houseId, existing)
  }

  removeConnection(houseId: string, connectionId: string) {
    const existing = this.connections.get(houseId) || []
    this.connections.set(
      houseId,
      existing.filter((c) => c.id !== connectionId)
    )
  }

  async emit(event: SSEEvent) {
    const connections = this.connections.get(event.houseId) || []
    const data = `data: ${JSON.stringify(event)}\n\n`

    const deadConnections: string[] = []

    for (const conn of connections) {
      try {
        await conn.writer.write(conn.encoder.encode(data))
      } catch {
        deadConnections.push(conn.id)
      }
    }

    // Clean up dead connections
    if (deadConnections.length > 0) {
      this.connections.set(
        event.houseId,
        connections.filter((c) => !deadConnections.includes(c.id))
      )
    }
  }

  getConnectionCount(houseId: string): number {
    return (this.connections.get(houseId) || []).length
  }
}

// Singleton
const globalForEvents = globalThis as unknown as {
  eventBus: EventBus | undefined
}

export const eventBus = globalForEvents.eventBus ?? new EventBus()

if (process.env.NODE_ENV !== 'production') globalForEvents.eventBus = eventBus
