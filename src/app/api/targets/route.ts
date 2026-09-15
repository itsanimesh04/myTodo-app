import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createTargetSchema } from '@/lib/validations'

// GET /api/targets
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.houseMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json({ targets: [] })
    }

    const targets = await prisma.target.findMany({
      where: { houseId: membership.houseId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ targets })
  } catch (error) {
    console.error('GET /api/targets error:', error)
    return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 })
  }
}

// POST /api/targets
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const result = createTargetSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const membership = await prisma.houseMember.findFirst({
      where: { userId },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You must join a house first' },
        { status: 400 }
      )
    }

    const { title, description, targetType, targetValue, period } = result.data

    // Calculate date range
    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (period === 'weekly') {
      const dayOfWeek = now.getDay()
      startDate = new Date(now)
      startDate.setDate(now.getDate() - dayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else {
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    }

    // Count existing completed tasks in range for auto-tracking
    let currentValue = 0
    if ((targetType || 'tasks_completed') === 'tasks_completed') {
      const completedCount = await prisma.task.count({
        where: {
          userId,
          houseId: membership.houseId,
          status: 'completed',
          completedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      })
      currentValue = completedCount
    }

    const target = await prisma.target.create({
      data: {
        houseId: membership.houseId,
        userId,
        title,
        description: description || null,
        targetType: targetType || 'tasks_completed',
        targetValue,
        currentValue,
        period,
        startDate,
        endDate,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ target }, { status: 201 })
  } catch (error) {
    console.error('POST /api/targets error:', error)
    return NextResponse.json({ error: 'Failed to create target' }, { status: 500 })
  }
}
