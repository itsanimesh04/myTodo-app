import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateStreak, getWeekBounds, getMonthBounds } from '@/lib/utils'

// GET /api/progress - get progress stats for the house
// Supports ?fields=streak for lightweight streak-only response
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const fields = searchParams.get('fields')

    const membership = await prisma.houseMember.findFirst({
      where: { userId },
      include: {
        house: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ stats: null })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    // Lightweight streak-only mode for dashboard
    if (fields === 'streak') {
      const memberStreaks = await Promise.all(
        membership.house.members.map(async (member) => {
          const completedTasks = await prisma.task.findMany({
            where: {
              userId: member.userId,
              houseId: membership.houseId,
              status: 'completed',
              completedAt: { not: null },
            },
            select: { completedAt: true },
            orderBy: { completedAt: 'desc' },
            take: 90,
          })

          const completionDates = completedTasks
            .map((t) => t.completedAt)
            .filter(Boolean) as Date[]

          return {
            userId: member.userId,
            userName: member.user.name,
            currentStreak: calculateStreak(completionDates),
          }
        })
      )

      return NextResponse.json({ stats: { members: memberStreaks } })
    }

    // Full stats mode
    const { start: weekStart, end: weekEnd } = getWeekBounds()
    const { start: monthStart, end: monthEnd } = getMonthBounds()

    // Fetch all tasks for the house in one query instead of N+1
    const allTasks = await prisma.task.findMany({
      where: {
        houseId: membership.houseId,
      },
      select: {
        userId: true,
        status: true,
        dueAt: true,
        completedAt: true,
        createdAt: true,
      },
    })

    // Get stats for each member by filtering in-memory
    const memberStats = membership.house.members.map((member) => {
      const memberId = member.userId
      const memberTasks = allTasks.filter((t) => t.userId === memberId)

      // Today
      const todayTasks = memberTasks.filter((t) => {
        const dueAt = t.dueAt ? new Date(t.dueAt) : null
        const createdAt = new Date(t.createdAt)
        return (dueAt && dueAt >= todayStart && dueAt < todayEnd) ||
               (!dueAt && createdAt >= todayStart && createdAt < todayEnd)
      })
      const completedToday = memberTasks.filter((t) => {
        if (t.status !== 'completed' || !t.completedAt) return false
        const ca = new Date(t.completedAt)
        return ca >= todayStart && ca < todayEnd
      }).length
      const totalToday = Math.max(todayTasks.length, completedToday)

      // This week
      const weekTasks = memberTasks.filter((t) => {
        const dueAt = t.dueAt ? new Date(t.dueAt) : null
        const createdAt = new Date(t.createdAt)
        return (dueAt && dueAt >= weekStart && dueAt <= weekEnd) ||
               (createdAt >= weekStart && createdAt <= weekEnd)
      })
      const completedWeek = memberTasks.filter((t) => {
        if (t.status !== 'completed' || !t.completedAt) return false
        const ca = new Date(t.completedAt)
        return ca >= weekStart && ca <= weekEnd
      }).length
      const totalWeek = Math.max(weekTasks.length, completedWeek)

      // This month
      const monthTasks = memberTasks.filter((t) => {
        const dueAt = t.dueAt ? new Date(t.dueAt) : null
        const createdAt = new Date(t.createdAt)
        return (dueAt && dueAt >= monthStart && dueAt <= monthEnd) ||
               (createdAt >= monthStart && createdAt <= monthEnd)
      })
      const completedMonth = memberTasks.filter((t) => {
        if (t.status !== 'completed' || !t.completedAt) return false
        const ca = new Date(t.completedAt)
        return ca >= monthStart && ca <= monthEnd
      }).length
      const totalMonth = Math.max(monthTasks.length, completedMonth)

      // Streak
      const completionDates = memberTasks
        .filter((t) => t.status === 'completed' && t.completedAt)
        .map((t) => t.completedAt as Date)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .slice(0, 90)
      const currentStreak = calculateStreak(completionDates)

      return {
        userId: memberId,
        userName: member.user.name,
        userAvatar: member.user.avatar,
        tasksCompletedToday: completedToday,
        totalTasksToday: totalToday,
        tasksCompletedWeek: completedWeek,
        totalTasksWeek: totalWeek,
        tasksCompletedMonth: completedMonth,
        totalTasksMonth: totalMonth,
        completionRateToday: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0,
        completionRateWeek: totalWeek > 0 ? Math.round((completedWeek / totalWeek) * 100) : 0,
        completionRateMonth: totalMonth > 0 ? Math.round((completedMonth / totalMonth) * 100) : 0,
        currentStreak,
      }
    })

    // Calendar heatmap data (last 90 days)
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const heatmapData: Record<string, number> = {}
    allTasks
      .filter((t) => t.userId === userId && t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= ninetyDaysAgo)
      .forEach((t) => {
        if (t.completedAt) {
          const key = new Date(t.completedAt).toISOString().split('T')[0]
          heatmapData[key] = (heatmapData[key] || 0) + 1
        }
      })

    return NextResponse.json({
      stats: {
        members: memberStats,
        heatmap: heatmapData,
        houseName: membership.house.name,
      },
    })
  } catch (error) {
    console.error('GET /api/progress error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
