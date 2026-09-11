import { describe, expect, it } from 'vitest'
import { CATALOG, USER } from '@/data'
import { createSession, recordEvent, computeMetrics } from '../index'

describe('recordEvent behavior', () => {
  it('replans the upcoming queue on an early skip without losing played history', () => {
    let state = createSession({ seed: 55, now: new Date() })
    const firstId = state.phases[0].plannedTrackIds[0]
    const beforeUpcoming = state.phases[0].plannedTrackIds.slice(1)

    state = recordEvent(state, { type: 'trackStart', trackId: firstId, atMs: 0 })
    state = recordEvent(state, { type: 'skip', trackId: firstId, positionFraction: 0.05, atMs: 1 })

    const afterUpcoming = state.phases[0].plannedTrackIds.slice(1)
    expect(afterUpcoming).not.toEqual(beforeUpcoming)
    expect(state.playedTrackIds).toEqual([firstId])
  })

  it('does not re-weight tags on a late skip', () => {
    let state = createSession({ seed: 66, now: new Date() })
    const id = state.phases[0].plannedTrackIds[0]
    state = recordEvent(state, { type: 'trackStart', trackId: id, atMs: 0 })
    const before = state.tagWeightAdjustments

    state = recordEvent(state, { type: 'skip', trackId: id, positionFraction: 0.85, atMs: 1 })

    expect(state.tagWeightAdjustments).toEqual(before)
    expect(state.tasteVector).toEqual(state.baseTasteVector)
  })

  it('cuts a phase short after two non-adjacent early skips', () => {
    let state = createSession({ seed: 77, now: new Date() })

    let id = state.phases[0].plannedTrackIds[0]
    state = recordEvent(state, { type: 'trackStart', trackId: id, atMs: 0 })
    state = recordEvent(state, { type: 'skip', trackId: id, positionFraction: 0.05, atMs: 1 })
    expect(state.earlySkipsInPhase).toBe(1)

    id = state.phases[0].plannedTrackIds[1]
    state = recordEvent(state, { type: 'trackStart', trackId: id, atMs: 2 })
    state = recordEvent(state, { type: 'trackComplete', trackId: id, atMs: 3 })

    id = state.phases[0].plannedTrackIds[2]
    state = recordEvent(state, { type: 'trackStart', trackId: id, atMs: 4 })
    state = recordEvent(state, { type: 'skip', trackId: id, positionFraction: 0.1, atMs: 5 })

    expect(state.phases[0].status).toBe('cutShort')
    expect(state.earlySkipsInPhase).toBe(0)
    expect(state.currentPhaseIndex).toBe(1)
  })

  it('produces the arithmetically expected metrics for a scripted session', () => {
    let state = createSession({ seed: 88, now: new Date() })
    const [t0, t1, t2] = state.phases[0].plannedTrackIds

    state = recordEvent(state, { type: 'trackStart', trackId: t0, atMs: 0 })
    state = recordEvent(state, { type: 'trackComplete', trackId: t0, atMs: 1 })
    state = recordEvent(state, { type: 'trackStart', trackId: t1, atMs: 2 })
    state = recordEvent(state, { type: 'trackComplete', trackId: t1, atMs: 3 })
    state = recordEvent(state, { type: 'save', trackId: t1, atMs: 4 })
    state = recordEvent(state, { type: 'trackStart', trackId: t2, atMs: 5 })
    state = recordEvent(state, { type: 'skip', trackId: t2, positionFraction: 0.1, atMs: 6 })

    const metrics = computeMetrics(state)
    const libSet = new Set(state.libraryAtStart)
    const playedIds = [t0, t1, t2]

    const surfacedCount = playedIds.filter((id) => !libSet.has(id)).length
    const expectedSaveRate = surfacedCount === 0 ? 0 : 1 / surfacedCount
    expect(metrics.saveRateOnSurfaced).toBeCloseTo(expectedSaveRate)

    const libraryPlayedCount = playedIds.filter((id) => libSet.has(id)).length
    const librarySkippedCount = libSet.has(t2) ? 1 : 0
    const expectedLibrarySkipRate = libraryPlayedCount === 0 ? 0 : librarySkippedCount / libraryPlayedCount
    expect(metrics.librarySkipRate).toBeCloseTo(expectedLibrarySkipRate)
    expect(metrics.skipRateGapPp).toBeCloseTo((expectedLibrarySkipRate - USER.baselineSkipRate) * 100)

    const durT0 = CATALOG.tracksById.get(t0)!.durationSec
    const durT1 = CATALOG.tracksById.get(t1)!.durationSec
    const durT2 = CATALOG.tracksById.get(t2)!.durationSec
    const expectedLength = durT0 + durT1 + durT2 * 0.1
    expect(metrics.sessionLengthSec).toBeCloseTo(expectedLength)

    const notesCount = playedIds.filter((id) => CATALOG.tracksById.get(id)!.editorialNote !== null).length
    expect(metrics.editorialCoverageRate).toBeCloseTo(notesCount / 3)
  })
})
