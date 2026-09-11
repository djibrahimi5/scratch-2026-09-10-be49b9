import { describe, expect, it } from 'vitest'
import { CATALOG, FRIEND } from '@/data'
import { createSession, getContextCard } from '../index'
import type { SessionState } from '../types'

describe('context cards', () => {
  it('never fabricates editorial text for tracks with a null editorialNote', () => {
    const state = createSession({ seed: 1, now: new Date() })
    const nullTracks = CATALOG.tracks.filter((t) => t.editorialNote === null)

    const scoring: SessionState['scoring'] = { ...state.scoring }
    for (const t of nullTracks) {
      scoring[t.id] = { trackId: t.id, score: 1, sourceLabel: 'library', reasonTags: [] }
    }
    const testState: SessionState = { ...state, scoring }

    for (const t of nullTracks) {
      const card = getContextCard(testState, t.id)
      expect(card.editorialText).toBeNull()
      expect(card.reasonLine.length).toBeGreaterThan(0)
    }
  })

  it('attributes friend-seeded cards and picks different phase themes than a default session', () => {
    const seed = 123
    const now = new Date()
    const defaultState = createSession({ seed, now })
    const friendState = createSession({ seed, now, seedSource: { kind: 'friendPlaylist', friendId: FRIEND.id } })

    const defaultTags = defaultState.phases.map((p) => p.dominantTag)
    const friendTags = friendState.phases.map((p) => p.dominantTag)
    expect(friendTags).not.toEqual(defaultTags)

    for (const trackId of friendState.phases[0].plannedTrackIds) {
      expect(getContextCard(friendState, trackId).attribution).toBe(`From ${FRIEND.name}'s taste`)
    }

    const defaultCard = getContextCard(defaultState, defaultState.phases[0].plannedTrackIds[0])
    expect(defaultCard.attribution).toBeUndefined()
  })
})
