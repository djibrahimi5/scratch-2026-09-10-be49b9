import type { Catalog } from '@/data'
import { USER } from '@/data'
import type { Era, TagId } from '@/data/tags'
import type { Track } from '@/data/types'
import { rngPick, type RNG } from '@/lib/prng'
import { phaseName, phaseTrackCount } from './phases'
import { PHASE_ENERGY_ARC, PHASE_ERA_DOMINANCE_THRESHOLD, POOL_TARGET, TRENDING_POPULARITY_WEIGHT } from './constants'
import type { Phase, PoolSourceLabel, ScoredTrack, SessionState, TasteVector } from './types'

type BucketCounts = Record<PoolSourceLabel, number>

const BUCKET_FALLBACK_ORDER: PoolSourceLabel[] = ['library', 'tasteMatch', 'trending']

type AllocationContext = {
  catalog: Catalog
  taste: TasteVector
  libraryIds: Set<string>
  playedEverIds: Set<string>
  usedTrackIds: Set<string>
  usedArtistsByPhase: Map<number, Set<string>>
  realized: BucketCounts
  targetCounts: BucketCounts
  substitutions: string[]
  scoring: Record<string, ScoredTrack>
  rng: RNG
}

function eligibleBuckets(track: Track, ctx: AllocationContext, phaseTag: TagId): PoolSourceLabel[] {
  const buckets: PoolSourceLabel[] = []
  const isLibrary = ctx.libraryIds.has(track.id) || ctx.playedEverIds.has(track.id)
  if (isLibrary) buckets.push('library')
  if (!isLibrary && track.tags.includes(phaseTag)) buckets.push('tasteMatch')
  if (!ctx.playedEverIds.has(track.id)) buckets.push('trending')
  return buckets
}

function scoreTrack(track: Track, targetEnergy: number, taste: TasteVector, bucket: PoolSourceLabel): number {
  const tagAffinity = track.tags.reduce((sum, tag) => sum + taste[tag], 0)
  const energyFit = 1 - Math.abs(track.energy - targetEnergy)
  // Raised to a power so near-miss energy still ranks well but a track far
  // from the phase's target energy is pushed hard toward the bottom — this is
  // what keeps intra-phase energy spread tight even under artist/bucket
  // constraints that shrink the candidate pool.
  let score = tagAffinity * energyFit ** 4
  if (bucket === 'trending') {
    score *= 1 - TRENDING_POPULARITY_WEIGHT + TRENDING_POPULARITY_WEIGHT * track.popularity
  }
  return score
}

function reasonTagsFor(track: Track, phaseTag: TagId): TagId[] {
  return track.tags.includes(phaseTag) ? [phaseTag] : [...track.tags]
}

function bestInBucket(
  ctx: AllocationContext,
  phaseIndex: number,
  phaseTag: TagId,
  targetEnergy: number,
  bucket: PoolSourceLabel,
  opts: { relaxArtist?: boolean } = {},
): { track: Track; score: number } | null {
  const usedArtists = ctx.usedArtistsByPhase.get(phaseIndex) ?? new Set<string>()

  let bestScore = -Infinity
  let candidates: Track[] = []

  for (const track of ctx.catalog.tracks) {
    if (ctx.usedTrackIds.has(track.id)) continue
    if (!opts.relaxArtist && usedArtists.has(track.artistId)) continue
    if (!eligibleBuckets(track, ctx, phaseTag).includes(bucket)) continue

    const score = scoreTrack(track, targetEnergy, ctx.taste, bucket)
    if (score > bestScore) {
      bestScore = score
      candidates = [track]
    } else if (score === bestScore) {
      candidates.push(track)
    }
  }

  if (candidates.length === 0) return null
  const chosen = candidates.length === 1 ? candidates[0] : rngPick(ctx.rng, candidates)
  return { track: chosen, score: bestScore }
}

// How strongly the session-level pool ratio nudges bucket choice for a slot,
// as a multiplier on the candidate's own score. Deficit is expressed as a
// fraction of EACH bucket's own target (not raw counts) so library — whose
// target is ~4x trending's — doesn't win by default just from having a
// bigger number to be "behind" on. It can shift ranking among comparable
// candidates but can never make a badly off-energy pick outscore a good one.
const DEFICIT_WEIGHT = 2.5

function pickTrackForSlot(
  ctx: AllocationContext,
  phaseIndex: number,
  phaseTag: TagId,
  targetEnergy: number,
): { track: Track; bucket: PoolSourceLabel } | null {
  let best: { track: Track; bucket: PoolSourceLabel; combined: number } | null = null

  for (const bucket of BUCKET_FALLBACK_ORDER) {
    const candidate = bestInBucket(ctx, phaseIndex, phaseTag, targetEnergy, bucket)
    if (!candidate) continue
    const target = ctx.targetCounts[bucket]
    const deficitRatio = target > 0 ? (target - ctx.realized[bucket]) / target : 0
    const combined = candidate.score * (1 + DEFICIT_WEIGHT * deficitRatio)
    if (!best || combined > best.combined) {
      best = { track: candidate.track, bucket, combined }
    }
  }

  if (!best) {
    for (const bucket of BUCKET_FALLBACK_ORDER) {
      const candidate = bestInBucket(ctx, phaseIndex, phaseTag, targetEnergy, bucket, { relaxArtist: true })
      if (candidate) {
        ctx.substitutions.push(
          `"${phaseTag}" phase: every pool was dry with the no-repeat-artist rule applied — relaxed it for one track.`,
        )
        best = { track: candidate.track, bucket, combined: candidate.score }
        break
      }
    }
  }

  if (!best) return null

  ctx.scoring[best.track.id] = {
    trackId: best.track.id,
    score: best.combined,
    sourceLabel: best.bucket,
    reasonTags: reasonTagsFor(best.track, phaseTag),
  }
  return { track: best.track, bucket: best.bucket }
}

function resolvePhaseEra(trackIds: string[], catalog: Catalog): { era: Era; dominant: boolean } {
  const counts = new Map<Era, number>()
  for (const id of trackIds) {
    const track = catalog.tracksById.get(id)
    if (!track) continue
    counts.set(track.era, (counts.get(track.era) ?? 0) + 1)
  }

  let modalEra: Era = '70s'
  let modalCount = 0
  for (const [era, count] of counts) {
    if (count > modalCount) {
      modalCount = count
      modalEra = era
    }
  }

  const dominant = trackIds.length > 0 && modalCount / trackIds.length >= PHASE_ERA_DOMINANCE_THRESHOLD
  return { era: modalEra, dominant }
}

function fillPhaseSlots(
  ctx: AllocationContext,
  phaseIndex: number,
  phaseTag: TagId,
  targetEnergy: number,
  slotCount: number,
): { trackIds: string[]; poolBreakdown: Record<PoolSourceLabel, number> } {
  const trackIds: string[] = []
  const poolBreakdown: Record<PoolSourceLabel, number> = { library: 0, tasteMatch: 0, trending: 0 }
  const usedArtists = ctx.usedArtistsByPhase.get(phaseIndex) ?? new Set<string>()
  ctx.usedArtistsByPhase.set(phaseIndex, usedArtists)

  for (let slot = 0; slot < slotCount; slot++) {
    const picked = pickTrackForSlot(ctx, phaseIndex, phaseTag, targetEnergy)
    if (!picked) {
      ctx.substitutions.push(
        `Phase ${phaseIndex + 1} ("${phaseTag}"): ran out of eligible tracks, planned ${trackIds.length} of ${slotCount}.`,
      )
      break
    }
    trackIds.push(picked.track.id)
    ctx.usedTrackIds.add(picked.track.id)
    usedArtists.add(picked.track.artistId)
    ctx.realized[picked.bucket]++
    poolBreakdown[picked.bucket]++
  }

  return { trackIds, poolBreakdown }
}

export function buildSessionPlan(args: {
  phaseTags: TagId[]
  taste: TasteVector
  catalog: Catalog
  libraryIds: string[]
  playedEverIds: Set<string>
  rng: RNG
}): { phases: Phase[]; scoring: Record<string, ScoredTrack>; substitutions: string[] } {
  const { phaseTags, taste, catalog, libraryIds, playedEverIds, rng } = args

  const phaseSpecs = phaseTags.map((tag, index) => ({
    index,
    tag,
    targetEnergy: PHASE_ENERGY_ARC[index],
    trackCount: phaseTrackCount(rng),
  }))
  const total = phaseSpecs.reduce((sum, spec) => sum + spec.trackCount, 0)

  const ctx: AllocationContext = {
    catalog,
    taste,
    libraryIds: new Set(libraryIds),
    playedEverIds,
    usedTrackIds: new Set(),
    usedArtistsByPhase: new Map(),
    realized: { library: 0, tasteMatch: 0, trending: 0 },
    targetCounts: {
      library: total * POOL_TARGET.library,
      tasteMatch: total * POOL_TARGET.tasteMatch,
      trending: total * POOL_TARGET.trending,
    },
    substitutions: [],
    scoring: {},
    rng,
  }

  const phases: Phase[] = phaseSpecs.map((spec) => {
    const { trackIds, poolBreakdown } = fillPhaseSlots(ctx, spec.index, spec.tag, spec.targetEnergy, spec.trackCount)
    const { era, dominant } = resolvePhaseEra(trackIds, catalog)
    return {
      index: spec.index,
      name: phaseName(spec.tag, dominant ? era : null),
      dominantTag: spec.tag,
      era,
      plannedTrackIds: trackIds,
      poolBreakdown,
      status: 'pending',
    }
  })

  return { phases, scoring: ctx.scoring, substitutions: ctx.substitutions }
}

export function replanUnplayed(
  state: SessionState,
  args: { catalog: Catalog; taste: TasteVector; rng: RNG },
): { phases: Phase[]; scoring: Record<string, ScoredTrack>; substitutions: string[] } {
  const { catalog, taste, rng } = args

  const untouchedIds = new Set<string>()
  for (let i = 0; i < state.currentPhaseIndex; i++) {
    for (const id of state.phases[i].plannedTrackIds) untouchedIds.add(id)
  }
  const currentPhase = state.phases[state.currentPhaseIndex]
  for (let i = 0; i <= state.currentTrackIndex && i < currentPhase.plannedTrackIds.length; i++) {
    untouchedIds.add(currentPhase.plannedTrackIds[i])
  }

  const total = state.phases.reduce((sum, p) => sum + p.plannedTrackIds.length, 0)
  const realized: BucketCounts = { library: 0, tasteMatch: 0, trending: 0 }
  const scoring: Record<string, ScoredTrack> = {}
  for (const id of untouchedIds) {
    const scored = state.scoring[id]
    if (scored) {
      realized[scored.sourceLabel]++
      scoring[id] = scored
    }
  }

  const playedEverIds = new Set(USER.playHistory.map((e) => e.trackId))

  const ctx: AllocationContext = {
    catalog,
    taste,
    libraryIds: new Set(state.libraryAtStart),
    playedEverIds,
    usedTrackIds: new Set(untouchedIds),
    usedArtistsByPhase: new Map(),
    realized,
    targetCounts: {
      library: total * POOL_TARGET.library,
      tasteMatch: total * POOL_TARGET.tasteMatch,
      trending: total * POOL_TARGET.trending,
    },
    substitutions: [],
    scoring,
    rng,
  }

  // Seed used-artist sets from tracks that stay in place so replanned slots
  // still respect the no-repeated-artist-per-phase rule.
  state.phases.forEach((phase, phaseIndex) => {
    const usedArtists = new Set<string>()
    for (const id of phase.plannedTrackIds) {
      if (!untouchedIds.has(id)) continue
      const track = catalog.tracksById.get(id)
      if (track) usedArtists.add(track.artistId)
    }
    ctx.usedArtistsByPhase.set(phaseIndex, usedArtists)
  })

  const phases: Phase[] = state.phases.map((phase, phaseIndex) => {
    if (phaseIndex < state.currentPhaseIndex) return phase

    const keepCount = phaseIndex === state.currentPhaseIndex ? state.currentTrackIndex + 1 : 0
    const kept = phase.plannedTrackIds.slice(0, keepCount)
    const slotsToFill = phase.plannedTrackIds.length - kept.length

    const { trackIds: newIds } = fillPhaseSlots(
      ctx,
      phaseIndex,
      phase.dominantTag,
      PHASE_ENERGY_ARC[phaseIndex],
      slotsToFill,
    )

    const plannedTrackIds = [...kept, ...newIds]
    const poolBreakdown: Record<PoolSourceLabel, number> = { library: 0, tasteMatch: 0, trending: 0 }
    for (const id of plannedTrackIds) {
      const scored = ctx.scoring[id]
      if (scored) poolBreakdown[scored.sourceLabel]++
    }

    const { era, dominant } = resolvePhaseEra(plannedTrackIds, catalog)

    return {
      ...phase,
      name: phaseName(phase.dominantTag, dominant ? era : null),
      era,
      plannedTrackIds,
      poolBreakdown,
    }
  })

  return { phases, scoring: ctx.scoring, substitutions: ctx.substitutions }
}
