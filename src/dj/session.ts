import { CATALOG, FRIEND, PLAYLISTS, USER } from '@/data'
import { TAG_IDS, type TagId } from '@/data/tags'
import { withRng } from './rng-cursor'
import { selectPhaseTags } from './phases'
import { buildSessionPlan, replanUnplayed } from './pool'
import { applyAdjustments, blendTasteVectors, buildTasteVector, normalizeTaste, tasteFromTrackIds } from './taste'
import {
  COMPLETE_MULTIPLIER,
  EARLY_SKIP_MULTIPLIER,
  EARLY_SKIP_THRESHOLD,
  FRIEND_BLEND_FRIEND_WEIGHT,
  PHASE_TRUNCATE_EARLY_SKIPS,
  SEED_BLEND_USER_WEIGHT,
} from './constants'
import type {
  CreateSessionInput,
  DJEvent,
  Phase,
  SeedSource,
  SessionEvent,
  SessionMetrics,
  SessionState,
  TasteVector,
} from './types'

function dominantTagOf(v: TasteVector): TagId {
  let best: TagId = TAG_IDS[0]
  let bestValue = -Infinity
  for (const tag of TAG_IDS) {
    if (v[tag] > bestValue) {
      bestValue = v[tag]
      best = tag
    }
  }
  return best
}

function forcePhaseOneTag(tags: TagId[], forced: TagId): TagId[] {
  const result = [...tags]
  const idx = result.indexOf(forced)
  if (idx === -1) {
    result[result.length - 1] = forced
  } else {
    ;[result[0], result[idx]] = [result[idx], result[0]]
  }
  return result
}

function seedSourceLabel(seedSource: SeedSource): string {
  switch (seedSource.kind) {
    case 'default':
      return 'your taste'
    case 'song':
      return 'a song'
    case 'artist':
      return 'an artist'
    case 'library':
      return 'your library'
    case 'playlist': {
      const playlist = PLAYLISTS.find((p) => p.id === seedSource.playlistId)
      return playlist ? `"${playlist.title}"` : 'a playlist'
    }
    case 'friendPlaylist':
      return `${FRIEND.name}'s playlist`
  }
}

function resolveSeedTaste(
  seedSource: SeedSource,
  baseUserTaste: TasteVector,
): { workingTaste: TasteVector; forcedTag: TagId | null } {
  const tracksById = CATALOG.tracksById

  switch (seedSource.kind) {
    case 'default':
      return { workingTaste: baseUserTaste, forcedTag: null }
    case 'song': {
      const seedTaste = tasteFromTrackIds([seedSource.trackId], tracksById)
      return {
        workingTaste: blendTasteVectors(baseUserTaste, seedTaste, SEED_BLEND_USER_WEIGHT),
        forcedTag: dominantTagOf(seedTaste),
      }
    }
    case 'artist': {
      const trackIds = CATALOG.tracks.filter((t) => t.artistId === seedSource.artistId).map((t) => t.id)
      const seedTaste = tasteFromTrackIds(trackIds, tracksById)
      return {
        workingTaste: blendTasteVectors(baseUserTaste, seedTaste, SEED_BLEND_USER_WEIGHT),
        forcedTag: dominantTagOf(seedTaste),
      }
    }
    case 'library': {
      const seedTaste = tasteFromTrackIds(USER.library, tracksById)
      return {
        workingTaste: blendTasteVectors(baseUserTaste, seedTaste, SEED_BLEND_USER_WEIGHT),
        forcedTag: dominantTagOf(seedTaste),
      }
    }
    case 'playlist': {
      const playlist = PLAYLISTS.find((p) => p.id === seedSource.playlistId)
      const seedTaste = tasteFromTrackIds(playlist?.trackIds ?? [], tracksById)
      return {
        workingTaste: blendTasteVectors(baseUserTaste, seedTaste, SEED_BLEND_USER_WEIGHT),
        forcedTag: dominantTagOf(seedTaste),
      }
    }
    case 'friendPlaylist': {
      const seedTaste = tasteFromTrackIds(FRIEND.playlist.trackIds, tracksById)
      return {
        workingTaste: blendTasteVectors(seedTaste, baseUserTaste, FRIEND_BLEND_FRIEND_WEIGHT),
        forcedTag: dominantTagOf(seedTaste),
      }
    }
  }
}

export function createSession(input: CreateSessionInput): SessionState {
  const seedSource: SeedSource = input.seedSource ?? { kind: 'default' }
  const baseUserTaste = buildTasteVector(USER.playHistory, CATALOG.tracksById, input.now)
  const { workingTaste, forcedTag } = resolveSeedTaste(seedSource, baseUserTaste)

  const playedEverIds = new Set(USER.playHistory.map((e) => e.trackId))

  const { value: plan, cursor } = withRng(input.seed, 0, (rng) => {
    let phaseTags = selectPhaseTags(workingTaste, rng)
    if (forcedTag) phaseTags = forcePhaseOneTag(phaseTags, forcedTag)
    return buildSessionPlan({
      phaseTags,
      taste: workingTaste,
      catalog: CATALOG,
      libraryIds: USER.library,
      playedEverIds,
      rng,
    })
  })

  const sessionStartEvent: SessionEvent = {
    type: 'sessionStart',
    atMs: 0,
    message: `Session started from ${seedSourceLabel(seedSource)} — first phase "${plan.phases[0].name}".`,
    data: { seedSource },
  }

  return {
    seed: input.seed,
    seedSource,
    tasteVector: workingTaste,
    baseTasteVector: workingTaste,
    phases: plan.phases,
    currentPhaseIndex: 0,
    currentTrackIndex: 0,
    playedTrackIds: [],
    tagWeightAdjustments: {},
    eventLog: [sessionStartEvent],
    earlySkipsInPhase: 0,
    savedThisSession: [],
    status: 'active',
    rngCursor: cursor,
    scoring: plan.scoring,
    libraryAtStart: [...USER.library],
    substitutions: plan.substitutions,
    skipPositions: {},
  }
}

function locateTrack(phases: Phase[], trackId: string): { phaseIndex: number; trackIndex: number } {
  for (const phase of phases) {
    const trackIndex = phase.plannedTrackIds.indexOf(trackId)
    if (trackIndex !== -1) return { phaseIndex: phase.index, trackIndex }
  }
  throw new Error(`recordEvent: track "${trackId}" is not part of this session's plan`)
}

function trackTitle(trackId: string): string {
  return CATALOG.tracksById.get(trackId)?.title ?? trackId
}

function trackTags(trackId: string): TagId[] {
  return CATALOG.tracksById.get(trackId)?.tags ?? []
}

function recomputeTaste(state: Pick<SessionState, 'baseTasteVector' | 'tagWeightAdjustments'>): TasteVector {
  return normalizeTaste(applyAdjustments(state.baseTasteVector, state.tagWeightAdjustments))
}

export function recordEvent(state: SessionState, event: DJEvent): SessionState {
  switch (event.type) {
    case 'trackStart': {
      const { phaseIndex, trackIndex } = locateTrack(state.phases, event.trackId)
      const phases = state.phases.map((p) => ({ ...p }))
      const eventLog = [...state.eventLog]

      let earlySkipsInPhase = state.earlySkipsInPhase

      if (phaseIndex !== state.currentPhaseIndex) {
        const previous = phases[state.currentPhaseIndex]
        if (previous.status === 'active' || previous.status === 'pending') {
          previous.status = 'completed'
        }
        phases[phaseIndex].status = 'active'
        earlySkipsInPhase = 0
        eventLog.push({
          type: 'phaseTransition',
          atMs: event.atMs,
          message: `Moving into phase ${phaseIndex + 1}: "${phases[phaseIndex].name}".`,
          data: { phaseIndex },
        })
      } else if (phases[phaseIndex].status === 'pending') {
        phases[phaseIndex].status = 'active'
      }

      eventLog.push({
        type: 'trackStart',
        atMs: event.atMs,
        message: `Now playing "${trackTitle(event.trackId)}".`,
        data: { trackId: event.trackId },
      })

      return {
        ...state,
        phases,
        currentPhaseIndex: phaseIndex,
        currentTrackIndex: trackIndex,
        earlySkipsInPhase,
        eventLog,
      }
    }

    case 'trackComplete': {
      const tags = trackTags(event.trackId)
      const tagWeightAdjustments = { ...state.tagWeightAdjustments }
      for (const tag of tags) {
        tagWeightAdjustments[tag] = (tagWeightAdjustments[tag] ?? 1) * COMPLETE_MULTIPLIER
      }
      const tasteVector = recomputeTaste({ baseTasteVector: state.baseTasteVector, tagWeightAdjustments })

      const eventLog: SessionEvent[] = [
        ...state.eventLog,
        {
          type: 'trackComplete',
          atMs: event.atMs,
          message: `Finished "${trackTitle(event.trackId)}".`,
          data: { trackId: event.trackId },
        },
        {
          type: 'tagUpweight',
          atMs: event.atMs,
          message: `Up-weighted ${tags.join(', ') || 'no tags'} after a full play.`,
          data: { tags },
        },
      ]

      return {
        ...state,
        playedTrackIds: [...state.playedTrackIds, event.trackId],
        tagWeightAdjustments,
        tasteVector,
        eventLog,
      }
    }

    case 'skip': {
      const skipPositions = { ...state.skipPositions, [event.trackId]: event.positionFraction }
      const playedTrackIds = [...state.playedTrackIds, event.trackId]
      const pct = Math.round(event.positionFraction * 100)

      if (event.positionFraction >= EARLY_SKIP_THRESHOLD) {
        const eventLog: SessionEvent[] = [
          ...state.eventLog,
          {
            type: 'skip',
            atMs: event.atMs,
            message: `Skipped "${trackTitle(event.trackId)}" at ${pct}% — late enough that it's not treated as a rejection.`,
            data: { trackId: event.trackId, positionFraction: event.positionFraction },
          },
        ]
        return { ...state, playedTrackIds, skipPositions, eventLog }
      }

      const tags = trackTags(event.trackId)
      const tagWeightAdjustments = { ...state.tagWeightAdjustments }
      for (const tag of tags) {
        tagWeightAdjustments[tag] = (tagWeightAdjustments[tag] ?? 1) * EARLY_SKIP_MULTIPLIER
      }
      const tasteVector = recomputeTaste({ baseTasteVector: state.baseTasteVector, tagWeightAdjustments })

      const eventLog: SessionEvent[] = [
        ...state.eventLog,
        {
          type: 'skip',
          atMs: event.atMs,
          message: `Skipped "${trackTitle(event.trackId)}" at ${pct}%.`,
          data: { trackId: event.trackId, positionFraction: event.positionFraction },
        },
        {
          type: 'tagDownweight',
          atMs: event.atMs,
          message: `Down-weighted ${tags.join(', ') || 'no tags'} after an early skip.`,
          data: { tags },
        },
      ]

      const stateForReplan: SessionState = {
        ...state,
        playedTrackIds,
        skipPositions,
        tagWeightAdjustments,
        tasteVector,
      }

      const { value: replanResult, cursor: rngCursor } = withRng(state.seed, state.rngCursor, (rng) =>
        replanUnplayed(stateForReplan, { catalog: CATALOG, taste: tasteVector, rng }),
      )

      const upcomingCount = replanResult.phases
        .slice(state.currentPhaseIndex)
        .reduce((sum, p, i) => sum + (i === 0 ? Math.max(p.plannedTrackIds.length - (state.currentTrackIndex + 1), 0) : p.plannedTrackIds.length), 0)

      eventLog.push({
        type: 'replan',
        atMs: event.atMs,
        message: `Replanned ${upcomingCount} upcoming track${upcomingCount === 1 ? '' : 's'} after the skip.`,
        data: { upcomingCount },
      })

      let earlySkipsInPhase = state.earlySkipsInPhase + 1
      let currentPhaseIndex = state.currentPhaseIndex
      let phases = replanResult.phases

      if (earlySkipsInPhase >= PHASE_TRUNCATE_EARLY_SKIPS) {
        const cutIndex = currentPhaseIndex
        phases = phases.map((p, i) => (i === cutIndex ? { ...p, status: 'cutShort' } : p))
        currentPhaseIndex = Math.min(cutIndex + 1, phases.length - 1)
        earlySkipsInPhase = 0
        const nextName = phases[currentPhaseIndex]?.name ?? 'the next phase'
        eventLog.push({
          type: 'phaseCutShort',
          atMs: event.atMs,
          message: `Phase ${cutIndex + 1} cut short after 2 early skips — advancing to "${nextName}".`,
          data: { phaseIndex: cutIndex },
        })
      }

      return {
        ...state,
        playedTrackIds,
        skipPositions,
        tagWeightAdjustments,
        tasteVector,
        phases,
        scoring: { ...state.scoring, ...replanResult.scoring },
        substitutions: [...state.substitutions, ...replanResult.substitutions],
        earlySkipsInPhase,
        currentPhaseIndex,
        rngCursor,
        eventLog,
      }
    }

    case 'save': {
      return {
        ...state,
        savedThisSession: [...state.savedThisSession, event.trackId],
        eventLog: [
          ...state.eventLog,
          {
            type: 'save',
            atMs: event.atMs,
            message: `Saved "${trackTitle(event.trackId)}" to your library.`,
            data: { trackId: event.trackId },
          },
        ],
      }
    }

    case 'endSession': {
      return {
        ...state,
        status: 'ended',
        eventLog: [
          ...state.eventLog,
          { type: 'sessionEnd', atMs: event.atMs, message: 'Session ended.' },
        ],
      }
    }
  }
}

export function computeMetrics(state: SessionState): SessionMetrics {
  const libraryAtStart = new Set(state.libraryAtStart)
  const playedIds = state.playedTrackIds

  const surfaced = playedIds.filter((id) => !libraryAtStart.has(id))
  const saveRateOnSurfaced = surfaced.length === 0 ? 0 : state.savedThisSession.length / surfaced.length

  const libraryPlayed = playedIds.filter((id) => libraryAtStart.has(id))
  const librarySkipped = libraryPlayed.filter((id) => state.skipPositions[id] !== undefined)
  const librarySkipRate = libraryPlayed.length === 0 ? 0 : librarySkipped.length / libraryPlayed.length

  const skipRateGapPp = (librarySkipRate - USER.baselineSkipRate) * 100

  const sessionLengthSec = playedIds.reduce((sum, id) => {
    const track = CATALOG.tracksById.get(id)
    if (!track) return sum
    const fraction = state.skipPositions[id] ?? 1
    return sum + track.durationSec * fraction
  }, 0)

  const withNotes = playedIds.filter((id) => CATALOG.tracksById.get(id)?.editorialNote != null)
  const editorialCoverageRate = playedIds.length === 0 ? 0 : withNotes.length / playedIds.length

  return { saveRateOnSurfaced, librarySkipRate, skipRateGapPp, sessionLengthSec, editorialCoverageRate }
}
