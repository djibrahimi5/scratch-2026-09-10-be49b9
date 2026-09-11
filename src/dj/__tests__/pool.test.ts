import { describe, expect, it } from 'vitest'
import { CATALOG } from '@/data'
import { createSession, recordEvent } from '../index'
import { POOL_TARGET, POOL_TOLERANCE } from '../constants'

function stdDev(nums: number[]): number {
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length
  return Math.sqrt(variance)
}

describe('session pool allocation', () => {
  it('keeps the session-level pool ratio within tolerance of target', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const state = createSession({ seed, now: new Date() })
      const scored = Object.values(state.scoring)
      const total = scored.length
      const counts = { library: 0, tasteMatch: 0, trending: 0 }
      for (const s of scored) counts[s.sourceLabel]++

      for (const bucket of ['library', 'tasteMatch', 'trending'] as const) {
        const ratio = counts[bucket] / total
        expect(ratio).toBeGreaterThanOrEqual(POOL_TARGET[bucket] - POOL_TOLERANCE)
        expect(ratio).toBeLessThanOrEqual(POOL_TARGET[bucket] + POOL_TOLERANCE)
      }
    }
  })

  it('never repeats an artist within a single phase', () => {
    const state = createSession({ seed: 21, now: new Date() })
    for (const phase of state.phases) {
      const artistIds = phase.plannedTrackIds.map((id) => CATALOG.tracksById.get(id)!.artistId)
      expect(new Set(artistIds).size).toBe(artistIds.length)
    }
  })

  it('never repeats a track across the whole session, including after a replan', () => {
    let state = createSession({ seed: 33, now: new Date() })
    const allIdsBefore = state.phases.flatMap((p) => p.plannedTrackIds)
    expect(new Set(allIdsBefore).size).toBe(allIdsBefore.length)

    state = recordEvent(state, { type: 'trackStart', trackId: state.phases[0].plannedTrackIds[0], atMs: 0 })
    state = recordEvent(state, {
      type: 'skip',
      trackId: state.phases[0].plannedTrackIds[0],
      positionFraction: 0.05,
      atMs: 1,
    })

    const allIdsAfter = state.phases.flatMap((p) => p.plannedTrackIds)
    expect(new Set(allIdsAfter).size).toBe(allIdsAfter.length)
  })

  it('keeps intra-phase energy standard deviation at or below 0.15', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const state = createSession({ seed, now: new Date() })
      for (const phase of state.phases) {
        const energies = phase.plannedTrackIds.map((id) => CATALOG.tracksById.get(id)!.energy)
        expect(stdDev(energies)).toBeLessThanOrEqual(0.15)
      }
    }
  })
})
