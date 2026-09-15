import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations'
import { eventBus } from '@/lib/events'
import { generateInviteCode } from '@/lib/utils'

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
    let membership = await prisma.houseMember.findFirst({
      where: { userId },
    })

    if (!membership) {
      // Auto-create house if user has none
      const user = await prisma.user.findUnique({ where: { id: userId } })
      const inviteCode = generateInviteCode()
      const house = await prisma.house.create({
        data: {
          name: `${user?.name ? user.name.split(' ')[0] : 'My'}'s House`,
          ownerId: userId,
          inviteCode,
          members: {
            create: {
              userId,
              role: 'owner',
            },
          },
        },
      })
      membership = await prisma.houseMember.findFirst({
        where: { userId, houseId: house.id },
      })
    }

    if (!membership) {
      return NextResponse.json({ tasks: [] })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.

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
      // Don't duplicate combined tasks in partner's standalone list
      where.isCombined = { not: true }
    } else {
      // For my view: show tasks I created OR combined tasks in the house
      where.OR = [
        { userId: userId },
        { isCombined: true },
      ]
    }

    // Apply date filters
    if (filter === 'today') {
      const baseOr = where.OR || []
      const dateConditions = [
        { dueAt: { gte: todayStart, lt: todayEnd } },
        { dueAt: null, createdAt: { gte: todayStart } },
        { status: 'pending', dueAt: { lt: todayStart } }, // overdue
        // Repeat tasks within 30 days
        {
          repeatType: 'daily',
          OR: [
            { repeatUntil: null },
            { repeatUntil: { gte: todayStart } },
          ],
        },
        {
          repeatType: 'weekdays',
          repeatDays: { has: currentDayOfWeek },
          OR: [
            { repeatUntil: null },
            { repeatUntil: { gte: todayStart } },
          ],
        },
        {
          repeatType: 'custom',
          repeatDays: { has: currentDayOfWeek },
          OR: [
            { repeatUntil: null },
            { repeatUntil: { gte: todayStart } },
          ],
        },
      ]

      if (showPartner) {
        where.AND = [{ OR: dateConditions }]
      } else {
        where.AND = [
          { OR: [{ userId: userId }, { isCombined: true }] },
          { OR: dateConditions },
        ]
        delete where.OR
      }
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

    // Find user's house, or auto-create one
    let membership = await prisma.houseMember.findFirst({
      where: { userId },
    })

    if (!membership) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      const inviteCode = generateInviteCode()
      const house = await prisma.house.create({
        data: {
          name: `${user?.name ? user.name.split(' ')[0] : 'My'}'s House`,
          ownerId: userId,
          inviteCode,
          members: {
            create: {
              userId,
              role: 'owner',
            },
          },
        },
      })
      membership = await prisma.houseMember.findFirst({
        where: { userId, houseId: house.id },
      })
    }

    if (!membership) {
      return NextResponse.json(
        { error: 'Failed to find or create house' },
        { status: 500 }
      )
    }

    const {
      title,
      description,
      dueAt,
      priority,
      visibility,
      recurringRule,
      tag,
      isCombined,
      repeatType,
      repeatDays,
    } = result.data

    // Repeat up to max 30 days from now
    let calculatedRepeatUntil: Date | null = null
    if (repeatType && repeatType !== 'none') {
      calculatedRepeatUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    const task = await prisma.task.create({
      data: {
        houseId: membership.houseId,
        userId,
        title,
        description: description || null,
        dueAt: dueAt ? new Date(dueAt) : null,
        priority: priority || 'none',
        visibility: isCombined ? 'shared' : (visibility || 'shared'),
        recurringRule: recurringRule ? JSON.stringify(recurringRule) : null,
        tag: tag || null,
        isCombined: !!isCombined,
        completedBy: [],
        repeatType: repeatType || null,
        repeatDays: repeatDays || [],
        repeatUntil: calculatedRepeatUntil,
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
