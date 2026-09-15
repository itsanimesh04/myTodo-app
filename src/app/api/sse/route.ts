import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id

  // Find user's house
  const membership = await prisma.houseMember.findFirst({
    where: { userId },
  })

  // If user has no house, send a valid SSE stream with a no_house event
  // instead of an error (which causes infinite reconnect loops)
  if (!membership) {
    const noHouseStream = new TransformStream()
    const noHouseWriter = noHouseStream.writable.getWriter()
    const noHouseEncoder = new TextEncoder()

    noHouseWriter.write(noHouseEncoder.encode(`data: ${JSON.stringify({ type: 'no_house' })}\n\n`))

    const noHouseKeepAlive = setInterval(async () => {
      try {
        await noHouseWriter.write(noHouseEncoder.encode(': keepalive\n\n'))
      } catch {
        clearInterval(noHouseKeepAlive)
      }
    }, 30000)

    request.signal.addEventListener('abort', () => {
      clearInterval(noHouseKeepAlive)
      noHouseWriter.close().catch(() => {})
    })

    return new Response(noHouseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Encoding': 'none',
      },
    })
  }

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  const connectionId = `${userId}-${Date.now()}`

  // Register connection
  eventBus.addConnection(membership.houseId, {
    id: connectionId,
    userId,
    houseId: membership.houseId,
    writer,
    encoder,
  })

  // Send keepalive
  const keepAlive = setInterval(async () => {
    try {
      await writer.write(encoder.encode(': keepalive\n\n'))
    } catch {
      clearInterval(keepAlive)
    }
  }, 30000)

  // Send initial connected event
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))

  // Handle disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive)
    eventBus.removeConnection(membership.houseId, connectionId)
    writer.close().catch(() => {})
  })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Encoding': 'none',
    },
  })
}
