import { describe, expect, it } from 'vitest'
import { ARTISTS, CATALOG, FRIEND, PLAYLISTS } from '@/data'
import { createSession } from '../index'
import { POOL_TARGET, POOL_TOLERANCE } from '../constants'
import type { SeedSource } from '../types'

const DEMO_SEEDS = [1, 2, 3, 4, 5] as const

const SEED_SOURCES: { kind: string; seedSource: SeedSource }[] = [
  { kind: 'default', seedSource: { kind: 'default' } },
  { kind: 'song', seedSource: { kind: 'song', trackId: CATALOG.tracks[0].id } },
  { kind: 'artist', seedSource: { kind: 'artist', artistId: ARTISTS[0].id } },
  { kind: 'library', seedSource: { kind: 'library' } },
  { kind: 'playlist', seedSource: { kind: 'playlist', playlistId: PLAYLISTS[0].id } },
  { kind: 'friendPlaylist', seedSource: { kind: 'friendPlaylist', friendId: FRIEND.id } },
]

// Empirically-determined exceptions: combos whose session-level pool ratio falls outside
// POOL_TOLERANCE because seed-taste blending shifts which tracks are eligible for a bucket.
// See PHASE_4_NOTES.md for the measured deltas. Every combo NOT listed here still asserts
// strictly against POOL_TOLERANCE — do not widen this to "fix" a failure without recording the
// real numbers, and never change src/dj/ to make one of these combos pass outright.
const KNOWN_FAILING: { kind: string; seed: number; widenedTolerance: number }[] = []

function findKnownFailing(kind: string, seed: number) {
  return KNOWN_FAILING.find((k) => k.kind === kind && k.seed === seed)
}

describe('seeded session pool allocation', () => {
  for (const { kind, seedSource } of SEED_SOURCES) {
    for (const seed of DEMO_SEEDS) {
      it(`keeps pool ratio within tolerance for seedSource=${kind}, seed=${seed}`, () => {
        const state = createSession({ seed, now: new Date(), seedSource })
        const scored = Object.values(state.scoring)
        const total = scored.length
        const counts = { library: 0, tasteMatch: 0, trending: 0 }
        for (const s of scored) counts[s.sourceLabel]++

        const known = findKnownFailing(kind, seed)
        const tolerance = known ? known.widenedTolerance : POOL_TOLERANCE
        const message = known
          ? `known-failing combo (see PHASE_4_NOTES.md): widened tolerance ${tolerance} for ${kind}/seed ${seed}`
          : undefined

        for (const bucket of ['library', 'tasteMatch', 'trending'] as const) {
          const ratio = counts[bucket] / total
          expect(ratio, message).toBeGreaterThanOrEqual(POOL_TARGET[bucket] - tolerance)
          expect(ratio, message).toBeLessThanOrEqual(POOL_TARGET[bucket] + tolerance)
        }
      })
    }
  }
})
