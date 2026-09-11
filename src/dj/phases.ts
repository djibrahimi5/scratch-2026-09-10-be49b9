import { TAG_IDS, type Era, type TagId } from '@/data/tags'
import { rngInt, rngWeightedPick, type RNG } from '@/lib/prng'
import type { TasteVector } from './types'
import { PHASE_TRACK_MAX, PHASE_TRACK_MIN } from './constants'

export const PHASE_PHRASES: Record<TagId, { long: string; short: string }> = {
  'late-night': { long: 'Late Night, Slow Burn', short: 'After Hours' },
  sunrise: { long: 'First Light', short: 'Sunrise' },
  driving: { long: 'Open Road', short: 'Highway' },
  focus: { long: 'Deep Work', short: 'Focus' },
  heartbreak: { long: 'The Long Way Down', short: 'Heartbreak' },
  euphoric: { long: 'Peak Hour', short: 'Euphoria' },
  'warm-up': { long: 'Easing In', short: 'Warm-Up' },
  'wind-down': { long: 'Last Call', short: 'Wind-Down' },
  'crate-digging': { long: 'Deep Cuts', short: 'Deep Cuts' },
  anthem: { long: 'Big Chorus', short: 'Anthems' },
}

/**
 * Weighted sampling WITHOUT replacement — five distinct tags drawn from the
 * taste vector. Deliberately not a deterministic top-5: two sessions for the
 * same user must be able to land on different phase themes, which is the
 * whole point of injecting a seed.
 */
export function selectPhaseTags(taste: TasteVector, rng: RNG): TagId[] {
  const remaining = [...TAG_IDS]
  const selected: TagId[] = []

  for (let i = 0; i < 5; i++) {
    const weights = remaining.map((tag) => taste[tag])
    const hasSignal = weights.some((w) => w > 0)
    const pick = hasSignal
      ? rngWeightedPick(rng, remaining, weights)
      : rngWeightedPick(
          rng,
          remaining,
          remaining.map(() => 1),
        )
    selected.push(pick)
    remaining.splice(remaining.indexOf(pick), 1)
  }

  return selected
}

export function phaseName(dominantTag: TagId, era: Era | null): string {
  const phrases = PHASE_PHRASES[dominantTag]
  if (era) return `${era} ${phrases.short}`
  return phrases.long
}

export function phaseTrackCount(rng: RNG): number {
  return rngInt(rng, PHASE_TRACK_MIN, PHASE_TRACK_MAX + 1)
}
