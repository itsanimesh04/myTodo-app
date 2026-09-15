import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/activity - get house activity feed
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const membership = await prisma.houseMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json({ activities: [] })
    }

    const activities = await prisma.activity.findMany({
      where: { houseId: membership.houseId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        task: { select: { id: true, title: true } },
        target: { select: { id: true, title: true } },
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('GET /api/activity error:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
