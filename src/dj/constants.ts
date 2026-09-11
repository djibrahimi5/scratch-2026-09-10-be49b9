import type { TagId } from '@/data/tags'
import type { TimeOfDay } from '@/lib/time'

export const RECENCY_WEIGHTS = {
  withinDays7: 3,
  withinDays30: 2,
  older: 1,
} as const

export function recencyWeight(daysAgo: number): number {
  if (daysAgo <= 7) return RECENCY_WEIGHTS.withinDays7
  if (daysAgo <= 30) return RECENCY_WEIGHTS.withinDays30
  return RECENCY_WEIGHTS.older
}

export const INCOMPLETE_PLAY_WEIGHT = 0.5

export const TIME_OF_DAY_BOOST = 1.25

export const TIME_OF_DAY_TAGS: Record<TimeOfDay, [TagId, TagId]> = {
  morning: ['sunrise', 'warm-up'],
  day: ['focus', 'driving'],
  evening: ['euphoric', 'anthem'],
  'late-night': ['late-night', 'wind-down'],
}

export const PHASE_COUNT = 5

export const PHASE_TRACK_MIN = 4
export const PHASE_TRACK_MAX = 6

export const PHASE_ENERGY_ARC = [0.45, 0.6, 0.75, 0.6, 0.4] as const

export const POOL_TARGET = {
  library: 0.6,
  tasteMatch: 0.25,
  trending: 0.15,
} as const

export const POOL_TOLERANCE = 0.08

export const EARLY_SKIP_THRESHOLD = 0.2

export const EARLY_SKIP_MULTIPLIER = 0.6

export const COMPLETE_MULTIPLIER = 1.15

export const PHASE_TRUNCATE_EARLY_SKIPS = 2

export const MAX_INTRA_PHASE_ENERGY_SD = 0.15

export const SEED_BLEND_USER_WEIGHT = 0.7

export const FRIEND_BLEND_FRIEND_WEIGHT = 0.7

export const PHASE_ERA_DOMINANCE_THRESHOLD = 0.6

export const TRENDING_POPULARITY_WEIGHT = 0.5
