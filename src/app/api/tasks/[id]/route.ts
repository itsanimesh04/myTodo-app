import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { updateTaskSchema } from '@/lib/validations'
import { eventBus } from '@/lib/events'

// PATCH /api/tasks/[id] - update a task
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id

    // Verify ownership
    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const result = updateTaskSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const data = result.data
    const wasCompleted = existing.status === 'completed'
    const isNowCompleted = data.status === 'completed'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...data }
    if (data.dueAt !== undefined) {
      updateData.dueAt = data.dueAt ? new Date(data.dueAt) : null
    }
    if (data.recurringRule !== undefined) {
      updateData.recurringRule = data.recurringRule ? JSON.stringify(data.recurringRule) : null
    }

    // Handle completion
    if (!wasCompleted && isNowCompleted) {
      updateData.completedAt = new Date()
    } else if (wasCompleted && !isNowCompleted) {
      updateData.completedAt = null
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Log activity for completion
    if (!wasCompleted && isNowCompleted) {
      await prisma.activity.create({
        data: {
          houseId: existing.houseId,
          userId,
          type: 'task_completed',
          relatedTaskId: task.id,
          metadata: JSON.stringify({ title: task.title }),
        },
      })

      // Auto-increment targets
      await autoUpdateTargets(userId, existing.houseId)
    }

    // Emit real-time event
    await eventBus.emit({
      type: isNowCompleted ? 'task_completed' : 'task_updated',
      houseId: existing.houseId,
      data: { task },
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - delete a task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id

    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.task.delete({ where: { id } })

    await eventBus.emit({
      type: 'task_updated',
      houseId: existing.houseId,
      data: { deletedTaskId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}

// Auto-update targets when tasks are completed
async function autoUpdateTargets(userId: string, houseId: string) {
  const now = new Date()

  const targets = await prisma.target.findMany({
    where: {
      userId,
      houseId,
      targetType: 'tasks_completed',
      startDate: { lte: now },
      endDate: { gte: now },
    },
  })

  for (const target of targets) {
    const newValue = target.currentValue + 1
    await prisma.target.update({
      where: { id: target.id },
      data: { currentValue: newValue },
    })

    // Check if target is now complete
    if (newValue >= target.targetValue && target.currentValue < target.targetValue) {
      await prisma.activity.create({
        data: {
          houseId,
          userId,
          type: 'target_reached',
          relatedTargetId: target.id,
          metadata: JSON.stringify({ title: target.title }),
        },
      })

      await eventBus.emit({
        type: 'target_updated',
        houseId,
        data: { targetId: target.id, completed: true },
      })
    }
  }
}
