import { describe, it } from 'vitest'
import { CATALOG } from '@/data'
import { computeMetrics, createSession, getDebugSnapshot, recordEvent } from '../index'
import { PHASE_ENERGY_ARC } from '../constants'

describe('DJ session demo', () => {
  it('prints a full session walkthrough', () => {
    const seed = 20260911
    const now = new Date()
    let state = createSession({ seed, now })

    console.log('\n=== DJ SESSION DEMO ===')
    console.log(`Seed: ${seed}`)

    state.phases.forEach((phase, i) => {
      console.log(
        `\nPhase ${phase.index + 1}: "${phase.name}" [${phase.dominantTag}] target energy ${PHASE_ENERGY_ARC[i]} — ${phase.status}`,
      )
      for (const trackId of phase.plannedTrackIds) {
        const track = CATALOG.tracksById.get(trackId)!
        const artist = CATALOG.artistsById.get(track.artistId)!
        const scored = state.scoring[trackId]
        console.log(`  ${track.title} — ${artist.name} — ${scored?.sourceLabel ?? '?'} — energy ${track.energy}`)
      }
    })

    const counts = { library: 0, tasteMatch: 0, trending: 0 }
    const scored = Object.values(state.scoring)
    for (const s of scored) counts[s.sourceLabel]++
    console.log('\nRealized session pool ratio:')
    console.log(
      `  library: ${((counts.library / scored.length) * 100).toFixed(1)}%  ` +
        `tasteMatch: ${((counts.tasteMatch / scored.length) * 100).toFixed(1)}%  ` +
        `trending: ${((counts.trending / scored.length) * 100).toFixed(1)}%`,
    )
    if (state.substitutions.length > 0) {
      console.log('\nSubstitutions:')
      for (const s of state.substitutions) console.log(`  - ${s}`)
    }

    console.log('\n=== SCRIPTED RUN: complete, complete, skip early, skip early ===')
    let t = 0
    const phase0 = state.phases[0].plannedTrackIds
    state = recordEvent(state, { type: 'trackStart', trackId: phase0[0], atMs: t++ })
    state = recordEvent(state, { type: 'trackComplete', trackId: phase0[0], atMs: t++ })
    state = recordEvent(state, { type: 'trackStart', trackId: phase0[1], atMs: t++ })
    state = recordEvent(state, { type: 'trackComplete', trackId: phase0[1], atMs: t++ })
    state = recordEvent(state, { type: 'trackStart', trackId: phase0[2], atMs: t++ })
    state = recordEvent(state, { type: 'skip', trackId: phase0[2], positionFraction: 0.05, atMs: t++ })
    const nextId = state.phases[0].plannedTrackIds[3]
    state = recordEvent(state, { type: 'trackStart', trackId: nextId, atMs: t++ })
    state = recordEvent(state, { type: 'skip', trackId: nextId, positionFraction: 0.1, atMs: t++ })

    console.log('\nEvent log:')
    for (const e of state.eventLog) console.log(`  [${e.type}] ${e.message}`)

    console.log('\nReplanned upcoming queue:')
    const snapshot = getDebugSnapshot(state)
    for (const phase of snapshot.phases.slice(state.currentPhaseIndex)) {
      const titles = phase.plannedTrackIds.map((id) => CATALOG.tracksById.get(id)!.title).join(', ')
      console.log(`  Phase ${phase.index + 1} "${phase.name}": ${titles}`)
    }

    console.log('\nMetrics:')
    console.log(JSON.stringify(computeMetrics(state), null, 2))
    console.log('\n=== END DEMO ===\n')
  })
})
