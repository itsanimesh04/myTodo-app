import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/events'

// POST /api/activity/[id]/react - add or toggle reaction
export async function POST(
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
    const body = await request.json()
    const { reactionType } = body

    if (!['nice', 'proud', 'keep_going'].includes(reactionType)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    // Verify activity exists and user is in the same house
    const activity = await prisma.activity.findUnique({
      where: { id },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const membership = await prisma.houseMember.findFirst({
      where: { userId, houseId: activity.houseId },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Toggle: if same reaction exists, remove it
    const existing = await prisma.reaction.findUnique({
      where: { activityId_userId: { activityId: id, userId } },
    })

    if (existing) {
      if (existing.reactionType === reactionType) {
        await prisma.reaction.delete({ where: { id: existing.id } })
        return NextResponse.json({ removed: true })
      }
      // Update reaction type
      const reaction = await prisma.reaction.update({
        where: { id: existing.id },
        data: { reactionType },
      })
      return NextResponse.json({ reaction })
    }

    // Create new reaction
    const reaction = await prisma.reaction.create({
      data: {
        activityId: id,
        userId,
        reactionType,
      },
    })

    await eventBus.emit({
      type: 'reaction_new',
      houseId: activity.houseId,
      data: { activityId: id, reaction },
    })

    return NextResponse.json({ reaction }, { status: 201 })
  } catch (error) {
    console.error('POST /api/activity/[id]/react error:', error)
    return NextResponse.json({ error: 'Failed to react' }, { status: 500 })
  }
}
