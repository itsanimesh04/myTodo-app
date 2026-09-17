import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateStreak, getDayBounds, getWeekBounds, getMonthBounds, getDayString, APP_TIMEZONE } from '@/lib/utils'

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

    const { start: todayStart, end: todayEnd } = getDayBounds()

    // Lightweight streak-only mode for dashboard
    if (fields === 'streak') {
      const memberStreaks = await Promise.all(
        membership.house.members.map(async (member) => {
          const completedTasks = await prisma.task.findMany({
            where: {
              houseId: membership.houseId,
              OR: [
                {
                  userId: member.userId,
                  status: 'completed',
                  completedAt: { not: null },
                },
                {
                  isCombined: true,
                  completedBy: { has: member.userId },
                },
              ],
            },
            select: { completedAt: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 180,
          })

          const completionDates = completedTasks
            .map((t) => t.completedAt || t.updatedAt)
            .filter(Boolean) as Date[]

          const currentStreak = calculateStreak(completionDates)
          const score = (completedTasks.length * 10) + (currentStreak * 25)

          return {
            userId: member.userId,
            userName: member.user.name,
            userAvatar: member.user.avatar,
            currentStreak,
            score,
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
        id: true,
        userId: true,
        status: true,
        dueAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        isCombined: true,
        completedBy: true,
      },
    })

    // Get stats for each member by filtering in-memory
    const memberStats = membership.house.members.map((member) => {
      const memberId = member.userId
      const memberTasks = allTasks.filter(
        (t) => t.userId === memberId || (t.isCombined && (t.completedBy?.includes(memberId) || t.userId === memberId))
      )

      const isCompletedByMember = (t: typeof allTasks[0]) => {
        if (t.isCombined) {
          return t.completedBy?.includes(memberId)
        }
        return t.status === 'completed' && !!t.completedAt
      }

      const getCompletionDate = (t: typeof allTasks[0]) => {
        return t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt)
      }

      // Today
      const todayTasks = memberTasks.filter((t) => {
        const dueAt = t.dueAt ? new Date(t.dueAt) : null
        const createdAt = new Date(t.createdAt)
        return (dueAt && dueAt >= todayStart && dueAt < todayEnd) ||
               (!dueAt && createdAt >= todayStart && createdAt < todayEnd)
      })
      const completedToday = memberTasks.filter((t) => {
        if (!isCompletedByMember(t)) return false
        const ca = getCompletionDate(t)
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
        if (!isCompletedByMember(t)) return false
        const ca = getCompletionDate(t)
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
        if (!isCompletedByMember(t)) return false
        const ca = getCompletionDate(t)
        return ca >= monthStart && ca <= monthEnd
      }).length
      const totalMonth = Math.max(monthTasks.length, completedMonth)

      // Streak
      const completionDates = memberTasks
        .filter(isCompletedByMember)
        .map(getCompletionDate)
        .sort((a, b) => b.getTime() - a.getTime())

      const currentStreak = calculateStreak(completionDates)
      const totalCompleted = memberTasks.filter(isCompletedByMember).length
      const score = (totalCompleted * 10) + (currentStreak * 25)

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
        score,
      }
    })

    // Calendar heatmap data (last 90 days)
    const ninetyDaysAgo = new Date(todayStart)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const heatmapData: Record<string, number> = {}
    allTasks
      .filter((t) => {
        const isUserTask = t.userId === userId || (t.isCombined && t.completedBy?.includes(userId))
        const isDone = t.isCombined ? t.completedBy?.includes(userId) : (t.status === 'completed' && !!t.completedAt)
        return isUserTask && isDone
      })
      .forEach((t) => {
        const ca = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt)
        if (ca >= ninetyDaysAgo) {
          const key = getDayString(ca, APP_TIMEZONE)
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
