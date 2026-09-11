import { describe, expect, it } from 'vitest'
import { createSession, recordEvent } from '../index'
import type { SessionState } from '../types'

function scriptedRun(seed: number, now: Date): SessionState {
  let state = createSession({ seed, now })
  let t = 0
  const next = (phaseIdx: number, trackIdx: number) => state.phases[phaseIdx].plannedTrackIds[trackIdx]

  state = recordEvent(state, { type: 'trackStart', trackId: next(0, 0), atMs: t++ })
  state = recordEvent(state, { type: 'trackComplete', trackId: next(0, 0), atMs: t++ })
  state = recordEvent(state, { type: 'trackStart', trackId: next(0, 1), atMs: t++ })
  state = recordEvent(state, { type: 'trackComplete', trackId: next(0, 1), atMs: t++ })
  state = recordEvent(state, { type: 'save', trackId: next(0, 1), atMs: t++ })
  state = recordEvent(state, { type: 'trackStart', trackId: next(0, 2), atMs: t++ })
  state = recordEvent(state, { type: 'skip', trackId: next(0, 2), positionFraction: 0.9, atMs: t++ })
  state = recordEvent(state, { type: 'endSession', atMs: t++ })
  return state
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value as object).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

describe('determinism', () => {
  it('produces a deeply equal session for the same seed, inputs, and event sequence', () => {
    const now = new Date()
    const a = scriptedRun(1234, now)
    const b = scriptedRun(1234, now)
    expect(b).toEqual(a)
  })

  it('produces different phase tag sets for different seeds', () => {
    const now = new Date()
    const tagSets = [1, 2, 3, 4, 5].map((seed) =>
      createSession({ seed, now })
        .phases.map((p) => p.dominantTag)
        .join(','),
    )
    expect(new Set(tagSets).size).toBeGreaterThan(1)
  })

  it('survives a JSON round trip mid-session and keeps producing identical results', () => {
    const now = new Date()
    let state = createSession({ seed: 555, now })
    state = recordEvent(state, { type: 'trackStart', trackId: state.phases[0].plannedTrackIds[0], atMs: 0 })
    state = recordEvent(state, {
      type: 'skip',
      trackId: state.phases[0].plannedTrackIds[0],
      positionFraction: 0.05,
      atMs: 1,
    })

    const restored: SessionState = JSON.parse(JSON.stringify(state))
    expect(restored).toEqual(state)

    const nextTrackId = state.phases[state.currentPhaseIndex].plannedTrackIds[state.currentTrackIndex + 1]
    const continuedDirect = recordEvent(state, { type: 'trackStart', trackId: nextTrackId, atMs: 2 })
    const continuedFromDisk = recordEvent(restored, { type: 'trackStart', trackId: nextTrackId, atMs: 2 })
    expect(continuedFromDisk).toEqual(continuedDirect)

    const idAfter = continuedDirect.phases[continuedDirect.currentPhaseIndex].plannedTrackIds[continuedDirect.currentTrackIndex]
    const skippedDirect = recordEvent(continuedDirect, { type: 'skip', trackId: idAfter, positionFraction: 0.1, atMs: 3 })
    const skippedFromDisk = recordEvent(continuedFromDisk, { type: 'skip', trackId: idAfter, positionFraction: 0.1, atMs: 3 })
    expect(skippedFromDisk).toEqual(skippedDirect)
  })

  it('does not mutate a deeply frozen input state', () => {
    const now = new Date()
    const state = createSession({ seed: 42, now })
    const trackId = state.phases[0].plannedTrackIds[0]
    deepFreeze(state)

    expect(() => recordEvent(state, { type: 'trackStart', trackId, atMs: 0 })).not.toThrow()
    const result = recordEvent(state, { type: 'trackStart', trackId, atMs: 0 })
    expect(result).not.toBe(state)
  })

  it('round-trips through JSON with no loss', () => {
    const now = new Date()
    const state = scriptedRun(9001, now)
    const restored = JSON.parse(JSON.stringify(state))
    expect(restored).toEqual(state)
  })
})
