import { CATALOG, FRIEND } from '@/data'
import { buildContextCard } from './reasons'
import { computeMetrics, createSession, recordEvent } from './session'
import type { ContextCard, DebugSnapshot, PoolSourceLabel, SessionState } from './types'

export * from './types'
export { createSession, recordEvent, computeMetrics }

export function getContextCard(state: SessionState, trackId: string): ContextCard {
  const track = CATALOG.tracksById.get(trackId)
  if (!track) {
    throw new Error(`getContextCard: unknown track "${trackId}"`)
  }
  const scored = state.scoring[trackId]
  const friendName = state.seedSource.kind === 'friendPlaylist' ? FRIEND.name : undefined
  return buildContextCard({ track, scored, seedSource: state.seedSource, friendName })
}

export function getDebugSnapshot(state: SessionState): DebugSnapshot {
  const counts: Record<PoolSourceLabel, number> = { library: 0, tasteMatch: 0, trending: 0 }
  let total = 0
  for (const scored of Object.values(state.scoring)) {
    counts[scored.sourceLabel]++
    total++
  }
  const sessionPoolRatio =
    total === 0
      ? { library: 0, tasteMatch: 0, trending: 0 }
      : {
          library: counts.library / total,
          tasteMatch: counts.tasteMatch / total,
          trending: counts.trending / total,
        }

  return {
    seed: state.seed,
    rngCursor: state.rngCursor,
    seedSource: state.seedSource,
    tasteVector: state.tasteVector,
    baseTasteVector: state.baseTasteVector,
    phases: state.phases,
    sessionPoolRatio,
    substitutions: state.substitutions,
    eventLog: state.eventLog,
    metrics: computeMetrics(state),
  }
}
