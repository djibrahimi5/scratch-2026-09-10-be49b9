import { TAG_IDS, type TagId } from '@/data/tags'
import type { PlayHistoryEntry, Track } from '@/data/types'
import { daysBetween, timeOfDay } from '@/lib/time'
import type { TasteVector } from './types'
import { INCOMPLETE_PLAY_WEIGHT, TIME_OF_DAY_BOOST, TIME_OF_DAY_TAGS, recencyWeight } from './constants'

function emptyVector(): Record<TagId, number> {
  const v = {} as Record<TagId, number>
  for (const tag of TAG_IDS) v[tag] = 0
  return v
}

export function normalizeTaste(v: TasteVector): TasteVector {
  const total = TAG_IDS.reduce((sum, tag) => sum + v[tag], 0)
  const result = emptyVector()
  if (total <= 0) {
    for (const tag of TAG_IDS) result[tag] = 1 / TAG_IDS.length
    return result
  }
  for (const tag of TAG_IDS) result[tag] = v[tag] / total
  return result
}

export function buildTasteVector(
  playHistory: PlayHistoryEntry[],
  tracksById: Map<string, Track>,
  now: Date,
): TasteVector {
  const v = emptyVector()

  for (const entry of playHistory) {
    const track = tracksById.get(entry.trackId)
    if (!track) continue
    const daysAgo = daysBetween(new Date(entry.playedAt), now)
    const weight = recencyWeight(daysAgo) * (entry.completed ? 1 : INCOMPLETE_PLAY_WEIGHT)
    for (const tag of track.tags) v[tag] += weight
  }

  const [boostA, boostB] = TIME_OF_DAY_TAGS[timeOfDay(now)]
  v[boostA] *= TIME_OF_DAY_BOOST
  v[boostB] *= TIME_OF_DAY_BOOST

  return normalizeTaste(v)
}

export function blendTasteVectors(a: TasteVector, b: TasteVector, weightA: number): TasteVector {
  const v = emptyVector()
  for (const tag of TAG_IDS) v[tag] = weightA * a[tag] + (1 - weightA) * b[tag]
  return normalizeTaste(v)
}

export function tasteFromTrackIds(trackIds: string[], tracksById: Map<string, Track>): TasteVector {
  const v = emptyVector()
  for (const id of trackIds) {
    const track = tracksById.get(id)
    if (!track) continue
    for (const tag of track.tags) v[tag] += 1
  }
  return normalizeTaste(v)
}

export function applyAdjustments(
  base: TasteVector,
  adjustments: Partial<Record<TagId, number>>,
): TasteVector {
  const v = emptyVector()
  for (const tag of TAG_IDS) v[tag] = base[tag] * (adjustments[tag] ?? 1)
  return v
}
