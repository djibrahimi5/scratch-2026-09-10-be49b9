import { describe, expect, it } from 'vitest'
import { CATALOG, USER } from '@/data'
import { TAG_IDS } from '@/data/tags'
import { buildTasteVector } from '../taste'

describe('taste vector construction', () => {
  it('ranks the last-week tag cluster (euphoric) in the top 2', () => {
    const now = new Date()
    const taste = buildTasteVector(USER.playHistory, CATALOG.tracksById, now)
    const ranked = [...TAG_IDS].sort((a, b) => taste[b] - taste[a])
    expect(ranked.slice(0, 2)).toContain('euphoric')
  })

  it('boosts different tags for late-night vs. morning listening', () => {
    const base = new Date()
    const lateNight = new Date(base)
    lateNight.setHours(2, 0, 0, 0)
    const morning = new Date(base)
    morning.setHours(8, 0, 0, 0)

    const tasteLateNight = buildTasteVector(USER.playHistory, CATALOG.tracksById, lateNight)
    const tasteMorning = buildTasteVector(USER.playHistory, CATALOG.tracksById, morning)

    // Same history, different time-of-day nudge: late-night/wind-down should
    // read higher near 2am, sunrise/warm-up higher near 8am.
    expect(tasteLateNight['late-night']).toBeGreaterThan(tasteMorning['late-night'])
    expect(tasteMorning['warm-up']).toBeGreaterThan(tasteLateNight['warm-up'])
  })
})
