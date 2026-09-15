import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { updateTargetSchema } from '@/lib/validations'

// PATCH /api/targets/[id]
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
    const existing = await prisma.target.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const result = updateTargetSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
    }

    const target = await prisma.target.update({
      where: { id },
      data: result.data,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    })

    return NextResponse.json({ target })
  } catch (error) {
    console.error('PATCH /api/targets/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update target' }, { status: 500 })
  }
}

// DELETE /api/targets/[id]
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
    const existing = await prisma.target.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.target.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/targets/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete target' }, { status: 500 })
  }
}
