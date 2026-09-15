import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateInviteCode } from '@/lib/utils'

// POST /api/house/invite - regenerate invite code
export async function POST() {
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

    const newCode = generateInviteCode()

    await prisma.house.update({
      where: { id: membership.houseId },
      data: { inviteCode: newCode },
    })

    // Create new invitation record
    await prisma.invitation.create({
      data: {
        houseId: membership.houseId,
        inviterId: session.user.id,
        code: newCode,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({ inviteCode: newCode })
  } catch (error) {
    console.error('POST /api/house/invite error:', error)
    return NextResponse.json({ error: 'Failed to generate invite' }, { status: 500 })
  }
}
