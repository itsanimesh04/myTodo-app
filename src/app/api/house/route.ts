import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createHouseSchema } from '@/lib/validations'
import { generateInviteCode } from '@/lib/utils'
import { HOUSE_MAX_MEMBERS } from '@/lib/constants'

// GET /api/house - get current user's house
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.houseMember.findFirst({
      where: { userId: session.user.id },
      include: {
        house: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ house: null })
    }

    return NextResponse.json({ house: membership.house })
  } catch (error) {
    console.error('GET /api/house error:', error)
    return NextResponse.json({ error: 'Failed to fetch house' }, { status: 500 })
  }
}

// POST /api/house - create a new house
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user already has a house
    const existingMembership = await prisma.houseMember.findFirst({
      where: { userId },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already in a house' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const result = createHouseSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const inviteCode = generateInviteCode()

    const house = await prisma.house.create({
      data: {
        name: result.data.name,
        ownerId: userId,
        inviteCode,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    })

    // Create invitation
    await prisma.invitation.create({
      data: {
        houseId: house.id,
        inviterId: userId,
        code: inviteCode,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        houseId: house.id,
        userId,
        type: 'house_created',
        metadata: JSON.stringify({ name: house.name }),
      },
    })

    return NextResponse.json({ house }, { status: 201 })
  } catch (error) {
    console.error('POST /api/house error:', error)
    return NextResponse.json({ error: 'Failed to create house' }, { status: 500 })
  }
}

// PATCH /api/house - update house name
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.houseMember.findFirst({
      where: { userId: session.user.id },
      include: { house: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not in a house' }, { status: 400 })
    }

    if (membership.house.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the house owner can rename it' }, { status: 403 })
    }

    const body = await request.json()
    const name = body.name?.trim()

    if (!name || name.length > 50) {
      return NextResponse.json({ error: 'Invalid house name' }, { status: 400 })
    }

    const house = await prisma.house.update({
      where: { id: membership.houseId },
      data: { name },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ house })
  } catch (error) {
    console.error('PATCH /api/house error:', error)
    return NextResponse.json({ error: 'Failed to update house' }, { status: 500 })
  }
}

// DELETE /api/house - leave house
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.houseMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not in a house' }, { status: 400 })
    }

    // Remove membership
    await prisma.houseMember.delete({
      where: { id: membership.id },
    })

    // Check remaining members
    const remaining = await prisma.houseMember.count({
      where: { houseId: membership.houseId },
    })

    // If no one left, delete the house
    if (remaining === 0) {
      await prisma.house.delete({
        where: { id: membership.houseId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/house error:', error)
    return NextResponse.json({ error: 'Failed to leave house' }, { status: 500 })
  }
}
