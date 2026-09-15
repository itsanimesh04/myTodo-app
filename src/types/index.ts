export interface SessionUser {
  id: string
  name: string
  email: string
  avatar?: string | null
  theme: string
  houseId?: string | null
  houseName?: string | null
}

export interface TaskWithUser {
  id: string
  houseId: string
  userId: string
  title: string
  description: string | null
  dueAt: string | null
  priority: string
  status: string
  visibility: string
  recurringRule: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

export interface TargetWithUser {
  id: string
  houseId: string
  userId: string
  title: string
  description: string | null
  targetType: string
  targetValue: number
  currentValue: number
  period: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

export interface ActivityWithDetails {
  id: string
  houseId: string
  userId: string
  type: string
  relatedTaskId: string | null
  relatedTargetId: string | null
  metadata: string | null
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
  task?: {
    id: string
    title: string
  } | null
  target?: {
    id: string
    title: string
  } | null
  reactions: {
    id: string
    userId: string
    reactionType: string
    user: {
      id: string
      name: string
    }
  }[]
}

export interface HouseWithMembers {
  id: string
  name: string
  ownerId: string
  inviteCode: string
  createdAt: string
  members: {
    id: string
    userId: string
    role: string
    joinedAt: string
    user: {
      id: string
      name: string
      email: string
      avatar: string | null
    }
  }[]
}

export interface ProgressStats {
  tasksCompletedToday: number
  totalTasksToday: number
  tasksCompletedWeek: number
  totalTasksWeek: number
  tasksCompletedMonth: number
  totalTasksMonth: number
  completionRateToday: number
  completionRateWeek: number
  completionRateMonth: number
  currentStreak: number
}

export interface NotificationItem {
  id: string
  userId: string
  houseId: string | null
  type: string
  title: string
  message: string
  read: boolean
  relatedId: string | null
  createdAt: string
}

export interface SSEEvent {
  type: 'task_updated' | 'task_completed' | 'target_updated' | 'activity_new' | 'reaction_new' | 'house_updated'
  houseId: string
  data: Record<string, unknown>
}
