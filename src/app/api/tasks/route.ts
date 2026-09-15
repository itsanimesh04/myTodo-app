import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations'
import { eventBus } from '@/lib/events'

// GET /api/tasks - list tasks for current user's house
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'today'
    const showPartner = searchParams.get('partner') === 'true'

    // Find user's house
    const membership = await prisma.houseMember.findFirst({
      where: { userId },
    })

    if (!membership) {
      return NextResponse.json({ tasks: [] })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const weekEnd = new Date(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // Base query conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      houseId: membership.houseId,
    }

    // If showing partner's tasks, filter by visibility
    if (showPartner) {
      where.userId = { not: userId }
      where.visibility = 'shared'
    } else {
      where.userId = userId
    }

    // Apply date filters
    if (filter === 'today') {
      where.OR = [
        { dueAt: { gte: todayStart, lt: todayEnd } },
        { dueAt: null, createdAt: { gte: todayStart } },
        { status: 'pending', dueAt: { lt: todayStart } }, // overdue
      ]
    } else if (filter === 'upcoming') {
      where.dueAt = { gte: todayEnd, lt: weekEnd }
      where.status = 'pending'
    } else if (filter === 'completed') {
      where.status = 'completed'
    } else if (filter === 'all') {
      // no additional filter
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueAt: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/tasks - create a new task
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const result = createTaskSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    // Find user's house
    const membership = await prisma.houseMember.findFirst({
      where: { userId },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You must join a house first' },
        { status: 400 }
      )
    }

    const { title, description, dueAt, priority, visibility, recurringRule } = result.data

    const task = await prisma.task.create({
      data: {
        houseId: membership.houseId,
        userId,
        title,
        description: description || null,
        dueAt: dueAt ? new Date(dueAt) : null,
        priority: priority || 'none',
        visibility: visibility || 'shared',
        recurringRule: recurringRule ? JSON.stringify(recurringRule) : null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        houseId: membership.houseId,
        userId,
        type: 'task_created',
        relatedTaskId: task.id,
        metadata: JSON.stringify({ title: task.title }),
      },
    })

    // Emit real-time event
    await eventBus.emit({
      type: 'task_updated',
      houseId: membership.houseId,
      data: { task },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
