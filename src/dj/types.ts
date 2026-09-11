import type { TagId, Era } from '@/data/tags'

export type TasteVector = Record<TagId, number>

export type PoolSourceLabel = 'library' | 'tasteMatch' | 'trending'

export type ScoredTrack = {
  trackId: string
  score: number
  sourceLabel: PoolSourceLabel
  reasonTags: TagId[]
}

export type PhaseStatus = 'pending' | 'active' | 'completed' | 'cutShort'

export type Phase = {
  index: number
  name: string
  dominantTag: TagId
  era: Era
  plannedTrackIds: string[]
  poolBreakdown: { library: number; tasteMatch: number; trending: number }
  status: PhaseStatus
}

export type SessionEventType =
  | 'sessionStart'
  | 'trackStart'
  | 'trackComplete'
  | 'skip'
  | 'save'
  | 'phaseTransition'
  | 'phaseCutShort'
  | 'tagDownweight'
  | 'tagUpweight'
  | 'replan'
  | 'sessionEnd'

export type SessionEvent = {
  type: SessionEventType
  atMs: number
  message: string
  data?: Record<string, unknown>
}

export type SeedSource =
  | { kind: 'default' }
  | { kind: 'song'; trackId: string }
  | { kind: 'artist'; artistId: string }
  | { kind: 'library' }
  | { kind: 'playlist'; playlistId: string }
  | { kind: 'friendPlaylist'; friendId: string }

export type SessionMetrics = {
  saveRateOnSurfaced: number
  librarySkipRate: number
  skipRateGapPp: number
  sessionLengthSec: number
  editorialCoverageRate: number
}

export type SessionState = {
  seed: number
  seedSource: SeedSource
  tasteVector: TasteVector
  baseTasteVector: TasteVector
  phases: Phase[]
  currentPhaseIndex: number
  currentTrackIndex: number
  playedTrackIds: string[]
  tagWeightAdjustments: Partial<Record<TagId, number>>
  eventLog: SessionEvent[]
  earlySkipsInPhase: number
  savedThisSession: string[]
  status: 'active' | 'ended'
  rngCursor: number
  scoring: Record<string, ScoredTrack>
  libraryAtStart: string[]
  substitutions: string[]
  skipPositions: Record<string, number>
}

export type CreateSessionInput = {
  seed: number
  now: Date
  seedSource?: SeedSource
}

// Input events to recordEvent — distinct from SessionEvent, which is the LOG entry.
export type DJEvent =
  | { type: 'trackStart'; trackId: string; atMs: number }
  | { type: 'trackComplete'; trackId: string; atMs: number }
  | { type: 'skip'; trackId: string; positionFraction: number; atMs: number }
  | { type: 'save'; trackId: string; atMs: number }
  | { type: 'endSession'; atMs: number }

export type ContextCard = {
  sourceLabel: "Editor's note" | 'Album context' | 'Why this pick'
  editorialText: string | null
  reasonLine: string
  attribution?: string
}

export type DebugSnapshot = {
  seed: number
  rngCursor: number
  seedSource: SeedSource
  tasteVector: TasteVector
  baseTasteVector: TasteVector
  phases: Phase[]
  sessionPoolRatio: { library: number; tasteMatch: number; trending: number }
  substitutions: string[]
  eventLog: SessionEvent[]
  metrics: SessionMetrics
}
