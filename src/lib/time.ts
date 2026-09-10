const DAY_MS = 24 * 60 * 60 * 1000

export function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY_MS
}

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'late-night'

export function timeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours()
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'day'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'late-night'
}
