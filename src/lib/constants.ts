export const HOUSE_MAX_MEMBERS = 2

export const TASK_PRIORITIES = [
  { value: 'none', label: 'No priority', color: 'var(--color-text-tertiary)' },
  { value: 'low', label: 'Low', color: 'var(--color-priority-low)' },
  { value: 'medium', label: 'Medium', color: 'var(--color-priority-medium)' },
  { value: 'high', label: 'High', color: 'var(--color-priority-high)' },
] as const

export const RECURRING_OPTIONS = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekday', label: 'Every weekday' },
  { value: 'weekly', label: 'Every week' },
  { value: 'custom', label: 'Custom' },
] as const

export const DAYS_OF_WEEK = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
] as const

export const REACTION_TYPES = [
  { value: 'nice', label: 'Nice!', emoji: '👏' },
  { value: 'proud', label: 'Proud of you', emoji: '🌟' },
  { value: 'keep_going', label: 'Keep going', emoji: '💪' },
] as const

export const TARGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const

export const VISIBILITY_OPTIONS = [
  { value: 'shared', label: 'Shared', description: 'Your partner can see this task' },
  { value: 'private', label: 'Private', description: 'Only you can see this task' },
] as const

export const NOTIFICATION_TYPES = {
  TASK_REMINDER: 'task_reminder',
  PARTNER_COMPLETED: 'partner_completed',
  TARGET_REACHED: 'target_reached',
  WEEKLY_REVIEW: 'weekly_review',
  OVERDUE: 'overdue',
} as const

export const MOTIVATIONAL_SUBTITLES = [
  "Let's make today count.",
  "One task at a time.",
  "Small steps, big progress.",
  "You've got this.",
  "Focus on what matters.",
  "Progress, not perfection.",
  "Stay consistent.",
  "Keep the momentum going.",
] as const
