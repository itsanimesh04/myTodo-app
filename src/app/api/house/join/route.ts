import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { HOUSE_MAX_MEMBERS } from '@/lib/constants'
import { generateInviteCode } from '@/lib/utils'
import { eventBus } from '@/lib/events'

// POST /api/house/join - join a house via invite code
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user already in a house
    const existingMembership = await prisma.houseMember.findFirst({
      where: { userId },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already in a house. Leave your current house first.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const inviteCode = body.inviteCode?.trim()?.toUpperCase()

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    // Find house by invite code
    const house = await prisma.house.findUnique({
      where: { inviteCode },
      include: {
        members: true,
      },
    })

    if (!house) {
      return NextResponse.json(
        { error: 'Invalid invite code. Please check and try again.' },
        { status: 404 }
      )
    }

    // Check member limit
    if (house.members.length >= HOUSE_MAX_MEMBERS) {
      return NextResponse.json(
        { error: 'This House already has two members.' },
        { status: 400 }
      )
    }

    // Check if already a member
    const alreadyMember = house.members.find((m) => m.userId === userId)
    if (alreadyMember) {
      return NextResponse.json(
        { error: 'You are already a member of this house' },
        { status: 400 }
      )
    }

    // Join the house
    await prisma.houseMember.create({
      data: {
        houseId: house.id,
        userId,
        role: 'member',
      },
    })

    // Update invitation status
    await prisma.invitation.updateMany({
      where: { code: inviteCode, status: 'pending' },
      data: { status: 'accepted' },
    })

    // Log activity
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    await prisma.activity.create({
      data: {
        houseId: house.id,
        userId,
        type: 'member_joined',
        metadata: JSON.stringify({ name: user?.name }),
      },
    })

    // Regenerate invite code (one-time use)
    const newCode = generateInviteCode()
    await prisma.house.update({
      where: { id: house.id },
      data: { inviteCode: newCode },
    })

    // Emit event
    await eventBus.emit({
      type: 'house_updated',
      houseId: house.id,
      data: { memberJoined: userId },
    })

    return NextResponse.json({
      house: { id: house.id, name: house.name },
    })
  } catch (error) {
    console.error('POST /api/house/join error:', error)
    return NextResponse.json({ error: 'Failed to join house' }, { status: 500 })
  }
}
