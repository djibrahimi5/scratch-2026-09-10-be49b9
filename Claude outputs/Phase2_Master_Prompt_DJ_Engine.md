# Phase 2 Master Prompt — DJ Engine

> Paste into a fresh Claude Code session opened at the project root.

---

## Before you write any code

Read `CLAUDE.md` at the repo root. It is the master context for this project and it is authoritative — if anything in this prompt conflicts with it or with code that already exists, **follow the repo and tell me what conflicted.** Do not refactor Phase 1 to match this document.

Then read these five files and confirm you've read them:

- `src/dj/types.ts` — the DJ type surface, already written
- `src/data/types.ts` and `src/data/tags.ts` — the data model
- `src/lib/prng.ts` — seeded PRNG helpers you must use
- `src/lib/time.ts` — `daysBetween`, `timeOfDay`
- `src/data/user.ts` and `src/data/friend.ts` — the fixture data this engine reasons over

Then tell me your planned file list and your answer to the two open design questions below, and **wait for my go-ahead before implementing.**

---

## What Phase 2 is

Phase 1 shipped the app shell: a mock music-streaming web app (Vite + React 19 + TS + Tailwind v4) with a sidebar, routing, Home/Library/Search/New/Radio views, a 120-track invented catalog with procedural album art, a persistent now-playing bar, and simulated playback with a 1×/10×/60× demo-speed control. `src/views/DjView.tsx` is a placeholder.

**Phase 2 builds the DJ engine: `src/dj/`. Pure TypeScript. No React, no DOM, no UI.** Phase 3 builds the DJ view on top of it. Do not build UI in this phase, and do not start Phase 3.

### The product this implements

The DJ autonomously builds an evolving, themed listening session from the user's own taste with no input required (P0), plus optional user-seeded (P1) and friend-seeded (P2) modes. Its differentiator is that **its commentary is sourced, never generated** — every context card draws on `track.editorialNote`, which is authored data in the catalog.

**This is the hard rule of the whole project:** ~15% of tracks have `editorialNote: null` *on purpose*. When a track has no note, the context card shows only the scoring-derived reason line and **no editorial text**. Never invent, template, generate, or fall back to substitute editorial prose. If you find yourself writing a default string for the missing-note case, stop — the correct behavior is the absence of text. A required test asserts this across the entire catalog.

---

## Files to create

```
src/dj/
  constants.ts     all tuning values in one place
  taste.ts         taste vector construction and manipulation
  phases.ts        theme-phase tag selection, energy arc, phase naming
  pool.ts          track selection and bucket allocation
  reasons.ts       context-card construction
  session.ts       createSession, recordEvent, metrics
  index.ts         public API — the ONLY module Phase 3+ imports from
  __tests__/       unit tests + the demo snapshot
```

`src/dj/types.ts` already exists. **Extend it additively; do not rewrite it.**

---

## Existing types you must build against

From `src/dj/types.ts` — these names are canonical:

- `TasteVector = Record<TagId, number>`
- `PoolSourceLabel = 'library' | 'tasteMatch' | 'trending'`
- `ScoredTrack = { trackId, score, sourceLabel, reasonTags: TagId[] }`
- `PhaseStatus = 'pending' | 'active' | 'completed' | 'cutShort'`
- `Phase = { index, name, dominantTag, era, plannedTrackIds, poolBreakdown: {library, tasteMatch, trending}, status }`
- `SessionEventType = 'sessionStart' | 'trackStart' | 'trackComplete' | 'skip' | 'save' | 'phaseTransition' | 'phaseCutShort' | 'tagDownweight' | 'tagUpweight' | 'replan' | 'sessionEnd'`
- `SessionEvent = { type, atMs, message, data? }`
- `SeedSource = { kind: 'default' } | { kind: 'song', trackId } | { kind: 'artist', artistId } | { kind: 'library' } | { kind: 'playlist', playlistId } | { kind: 'friendPlaylist', friendId }`
- `SessionMetrics = { saveRateOnSurfaced, librarySkipRate, skipRateGapPp, sessionLengthSec, editorialCoverageRate }`
- `SessionState = { seed, seedSource, tasteVector, phases, currentPhaseIndex, currentTrackIndex, playedTrackIds, tagWeightAdjustments, eventLog, consecutiveSkipsInPhase, savedThisSession, status }`

Only `src/lib/storage.ts` currently imports from `@/dj/types` (it imports `SeedSource`). **Nothing consumes `SessionState` yet**, so additive changes and one rename are safe.

### Additions to make to `types.ts`

```ts
export type CreateSessionInput = {
  seed: number
  now: Date                    // injected — never read the clock inside src/dj
  seedSource?: SeedSource      // defaults to { kind: 'default' }
}

// Input events to recordEvent — distinct from SessionEvent, which is the LOG entry.
export type DJEvent =
  | { type: 'trackStart'; trackId: string; atMs: number }
  | { type: 'trackComplete'; trackId: string; atMs: number }
  | { type: 'skip'; trackId: string; positionFraction: number; atMs: number }
  | { type: 'save'; trackId: string; atMs: number }
  | { type: 'endSession'; atMs: number }

export type ContextCard = {
  sourceLabel: 'Editor's note' | 'Album context' | 'Why this pick'
  editorialText: string | null   // verbatim from track.editorialNote, or null. NEVER synthesized.
  reasonLine: string             // derived from the real ScoredTrack, not decorative
  attribution?: string           // friend-seeded sessions only
}

export type DebugSnapshot = {
  seed: number
  rngCursor: number
  seedSource: SeedSource
  tasteVector: TasteVector          // live, post-adjustment
  baseTasteVector: TasteVector      // as computed at session start
  phases: Phase[]
  sessionPoolRatio: { library: number; tasteMatch: number; trending: number }
  substitutions: string[]           // human-readable notes when a bucket ran dry
  eventLog: SessionEvent[]
  metrics: SessionMetrics
}
```

Add these fields to `SessionState`:

- `rngCursor: number` — see determinism below
- `baseTasteVector: TasteVector` — the pre-adjustment vector, for the debug panel
- `scoring: Record<string, ScoredTrack>` — selection metadata keyed by track ID, so `reasonLine` can be traced back to why a track was picked
- `libraryAtStart: string[]` — library membership snapshot, so metrics stay stable as the user saves during the session
- `substitutions: string[]`
- `skipPositions: Record<string, number>` — trackId → positionFraction, needed for `sessionLengthSec`

**Rename `consecutiveSkipsInPhase` → `earlySkipsInPhase`.** The rule is two *early* skips within a phase, not two back-to-back. The current name would lead someone to implement the literal reading, and the demo beat "skip twice, watch the phase cut short" would silently fail when the skips aren't adjacent. Update `CLAUDE.md` to drop the note about this mismatch once renamed.

---

## Determinism (hard requirement)

Nothing under `src/dj/` may call `Math.random()` or `Date.now()`. The seed and `now` are injected through `createSession`. Use `createRng`, `rngInt`, `rngPick`, `rngShuffle`, `rngWeightedPick` from `@/lib/prng`.

`SessionState` round-trips through `localStorage`, so it cannot hold a closure. Carry the RNG as a **cursor**: store `rngCursor` on the state, and rebuild the generator on demand by creating it from `seed` and fast-forwarding `rngCursor` draws, then write the new cursor back when done. Fast-forwarding costs a few hundred cheap calls — irrelevant at this scale, and it keeps the state plain JSON.

Write a small helper in `constants.ts` or a `rng-cursor.ts`:

```ts
function withRng<T>(seed: number, cursor: number, fn: (rng: RNG) => T): { value: T; cursor: number }
```

which creates the generator, burns `cursor` draws, wraps `rng` in a counting proxy, runs `fn`, and returns the new cursor. Every place the engine needs randomness goes through this. **Test 1 below proves it works.**

If you'd rather plan the entire session up front and re-derive deterministically on replan, that's an acceptable alternative — but pick one, document it in code comments, and make the determinism and replan tests prove it.

---

## `src/dj/constants.ts`

Every tuning value lives here so the debug panel and the docs reference one place.

| Constant | Value |
|---|---|
| `RECENCY_WEIGHTS` | ≤7 days ×3, ≤30 days ×2, older ×1 |
| `INCOMPLETE_PLAY_WEIGHT` | 0.5 |
| `TIME_OF_DAY_BOOST` | 1.25 |
| `PHASE_COUNT` | 5 |
| `PHASE_TRACK_MIN` / `MAX` | 4 / 6 |
| `PHASE_ENERGY_ARC` | `[0.45, 0.60, 0.75, 0.60, 0.40]` |
| `POOL_TARGET` | `{ library: 0.60, tasteMatch: 0.25, trending: 0.15 }` |
| `POOL_TOLERANCE` | 0.08 |
| `EARLY_SKIP_THRESHOLD` | 0.20 |
| `EARLY_SKIP_MULTIPLIER` | 0.6 |
| `COMPLETE_MULTIPLIER` | 1.15 |
| `PHASE_TRUNCATE_EARLY_SKIPS` | 2 |
| `MAX_INTRA_PHASE_ENERGY_SD` | 0.15 |
| `SEED_BLEND_USER_WEIGHT` | 0.70 (P1: 70% user / 30% seed) |
| `FRIEND_BLEND_FRIEND_WEIGHT` | 0.70 (P2: 70% friend / 30% user) |

Time-of-day tag boosts, keyed off `timeOfDay()` from `@/lib/time`:

- `morning` → `sunrise`, `warm-up`
- `day` → `focus`, `driving`
- `evening` → `euphoric`, `anthem`
- `late-night` → `late-night`, `wind-down`

---

## `src/dj/taste.ts`

```ts
buildTasteVector(playHistory: PlayHistoryEntry[], tracksById: Map<string, Track>, now: Date): TasteVector
blendTasteVectors(a: TasteVector, b: TasteVector, weightA: number): TasteVector
applyAdjustments(base: TasteVector, adjustments: Partial<Record<TagId, number>>): TasteVector
tasteFromTrackIds(trackIds: string[], tracksById: Map<string, Track>): TasteVector
normalizeTaste(v: TasteVector): TasteVector
```

`buildTasteVector`:

1. Start every tag at 0.
2. For each history entry, resolve the track, and add `recencyWeight × (entry.completed ? 1 : 0.5)` to each of its tags. Recency comes from `daysBetween(new Date(entry.playedAt), now)`.
3. Multiply the two tags matching `timeOfDay(now)` by 1.25.
4. Normalize so the vector sums to 1.

Every function returns a normalized vector. All ten tags are always present as keys, including zeros — downstream code and the debug panel both assume a complete record.

---

## `src/dj/phases.ts`

```ts
selectPhaseTags(taste: TasteVector, rng: RNG): TagId[]     // 5 distinct tags
phaseName(dominantTag: TagId, era: Era | null): string
PHASE_PHRASES: Record<TagId, { long: string; short: string }>
```

**Tag selection is weighted sampling without replacement** — draw with `rngWeightedPick` using the taste vector as weights, remove the drawn tag, repeat five times. Do **not** take the deterministic top 5: that makes every session for a given user identical and kills the demo. If fewer than 5 tags have non-zero weight, fill the remainder by weighted draw over the zero-weight tags with uniform weights.

Phase naming uses this map:

| Tag | `long` | `short` (era-prefixable) |
|---|---|---|
| `late-night` | Late Night, Slow Burn | After Hours |
| `sunrise` | First Light | Sunrise |
| `driving` | Open Road | Highway |
| `focus` | Deep Work | Focus |
| `heartbreak` | The Long Way Down | Heartbreak |
| `euphoric` | Peak Hour | Euphoria |
| `warm-up` | Easing In | Warm-Up |
| `wind-down` | Last Call | Wind-Down |
| `crate-digging` | Deep Cuts | Deep Cuts |
| `anthem` | Big Chorus | Anthems |

Rule: if **≥60% of the phase's selected tracks share one era**, the name is `` `${era} ${short}` `` (e.g. *"90s Deep Cuts"*) and `Phase.era` is that era. Otherwise the name is `long` and `Phase.era` is the modal era of the phase's tracks. Phase names appear in the UI, so this matters more than it looks.

Phase `i` gets target energy `PHASE_ENERGY_ARC[i]` and a track count drawn with `rngInt(rng, 4, 7)`.

---

## `src/dj/pool.ts`

```ts
buildSessionPlan(args: {
  phaseTags: TagId[]
  taste: TasteVector
  catalog: Catalog
  libraryIds: string[]
  playedEverIds: Set<string>     // from user.playHistory
  rng: RNG
}): { phases: Phase[]; scoring: Record<string, ScoredTrack>; substitutions: string[] }

replanUnplayed(state: SessionState, args: { catalog, taste, rng }): {
  phases: Phase[]; scoring: Record<string, ScoredTrack>; substitutions: string[]
}
```

### Buckets

- **`library`** — track is in `libraryIds` **or** appears in the user's play history.
- **`tasteMatch`** — not in the library, shares ≥1 tag with the phase tag, ranked by taste-vector affinity.
- **`trending`** — never played by the user, ranked by `popularity` descending.

### Allocation

Target 60/25/15 **across the whole session (~25 tracks)**, not per phase — a 4–6 track phase can't hit those ratios exactly. Carry a running per-bucket deficit and pick each track's bucket by largest deficit, so the session-level ratio lands inside ±0.08 even though individual phases vary. Record realized counts in `Phase.poolBreakdown`.

### Scoring within a bucket

Score = tag affinity (sum of `taste[tag]` over the track's tags that match the phase tag or are otherwise present) × an energy-fit term (`1 - |track.energy - phaseTargetEnergy|`). For `trending`, weight `popularity` in as well. Keep the formula simple and readable, put it in one function, and record the result on the `ScoredTrack` — the debug panel shows it and `reasons.ts` reads `sourceLabel` and `reasonTags` from it.

### Constraints (all tested)

- No artist appears twice within a single phase.
- No track repeats anywhere in the session.
- Intra-phase energy standard deviation ≤ 0.15 — prefer tracks near the phase's target energy.
- If a bucket runs dry, borrow in priority order `library → tasteMatch → trending`, push a human-readable line onto `substitutions`, and continue. **Never throw.** The catalog is only 120 tracks; running a bucket dry is expected, not exceptional.

### Replanning

`replanUnplayed` rebuilds every track after `currentTrackIndex` in the current phase plus all later phases, using the live adjusted taste vector. Already-played tracks and the currently-playing track are immutable history — never touch them, and never let a replan reintroduce a played track.

---

## `src/dj/reasons.ts`

```ts
buildContextCard(args: {
  track: Track
  scored: ScoredTrack | undefined
  seedSource: SeedSource
  friendName?: string
}): ContextCard
```

- `editorialText` is `track.editorialNote` **verbatim, or `null`**. No other value is ever possible.
- `sourceLabel`: `'Editor's note'` when a note exists; `'Why this pick'` when it doesn't. Use `'Album context'` only if you have a reason to distinguish it — otherwise leave it out of the rotation rather than assigning it randomly.
- `reasonLine` is generated from the real `ScoredTrack`, never decorative. Map `sourceLabel` + `reasonTags` to phrasing, e.g.:
  - `library` → *"From your late-night listening"* / *"You've had this one in your library a while"*
  - `tasteMatch` → *"Matches the deep-cuts run you've been on"*
  - `trending` → *"Trending with listeners who share your taste"*
  If a track has no `ScoredTrack` entry, that is a bug in `pool.ts` — throw in development rather than papering over it with a vague line.
- `attribution` is set **only** when `seedSource.kind === 'friendPlaylist'`: `` `From ${friendName}'s taste` ``.

---

## `src/dj/session.ts` and `index.ts`

Public API, exported from `index.ts` — Phase 3+ imports only from here:

```ts
createSession(input: CreateSessionInput): SessionState
recordEvent(state: SessionState, event: DJEvent): SessionState   // PURE
getContextCard(state: SessionState, trackId: string): ContextCard
getDebugSnapshot(state: SessionState): DebugSnapshot
computeMetrics(state: SessionState): SessionMetrics
```

`recordEvent` **must not mutate its input.** Return a new state object. A test deep-freezes the input and asserts no throw.

### `createSession`

1. Build the base taste vector from `USER.playHistory` and `now`.
2. Apply the seed source:
   - `default` → no change.
   - `song` → blend with `tasteFromTrackIds([trackId])` at 70% user / 30% seed; that track's dominant tag becomes phase 1's tag.
   - `artist` → same, over all the artist's tracks.
   - `library` → same, over `USER.library`.
   - `playlist` → same, over that playlist's `trackIds` (look it up in `PLAYLISTS` by `playlistId`).
   - `friendPlaylist` → blend at **70% friend / 30% user** over `FRIEND.playlist.trackIds`.
   In every seeded mode the DJ still controls phase count, progression, pacing, and pool ratios. Seeding biases selection; it does not hand over control.
3. Select 5 phase tags (phase 1 forced to the seed's dominant tag when seeded), build the session plan, and log a `sessionStart` event.

### `recordEvent` behavior by event

- **`trackStart`** — set `currentTrackIndex`/`currentPhaseIndex`, mark the phase `active`, append `trackStart`. If this is the first track of a new phase, append a `phaseTransition` event first and mark the previous phase `completed`.
- **`trackComplete`** — push to `playedTrackIds`, multiply the track's tags by 1.15 in `tagWeightAdjustments`, renormalize, append `trackComplete` + `tagUpweight`.
- **`skip` with `positionFraction < 0.20`** (early) — push to `playedTrackIds` and `skipPositions`, multiply the track's tags by 0.6, renormalize, increment `earlySkipsInPhase`, append `skip` + `tagDownweight`, then call `replanUnplayed` and append a `replan` event. If `earlySkipsInPhase` reaches 2, mark the phase `cutShort`, advance `currentPhaseIndex`, reset `earlySkipsInPhase` to 0, and append `phaseCutShort`.
- **`skip` with `positionFraction >= 0.20`** (late) — record it in `playedTrackIds` and `skipPositions` and append a `skip` event. **No re-weighting, no replan.** A skip near the end of a track is not a rejection.
- **`save`** — push to `savedThisSession`, append `save`. The engine does not touch `LibraryContext`; Phase 3 wires that.
- **`endSession`** — set `status: 'ended'`, append `sessionEnd`.

Every appended `SessionEvent.message` must be **written for a human reader** — the debug panel renders it verbatim. For example:

> `Skipped "Ceiling Fan" at 8% — down-weighted late-night, wind-down; replanned 11 upcoming tracks.`
> `Phase 2 cut short after 2 early skips — advancing to "90s Deep Cuts".`

Not `skip:track-low-light-02:0.08`. This log is a demo asset.

### `computeMetrics`

- `saveRateOnSurfaced` = `savedThisSession.length` ÷ (played tracks **not** in `libraryAtStart`). 0 when the denominator is 0.
- `librarySkipRate` = skipped ÷ played, over played tracks **in** `libraryAtStart`.
- `skipRateGapPp` = `(librarySkipRate - USER.baselineSkipRate) × 100`.
- `sessionLengthSec` = sum over played tracks of `durationSec`, times `skipPositions[id]` where the track was skipped.
- `editorialCoverageRate` = share of played tracks with `editorialNote !== null`.

---

## Tests — `src/dj/__tests__/`

All required. Vitest, `node` environment, `globals: true`.

1. **Determinism** — same seed, same inputs, same event sequence → deeply equal state, run twice.
2. **Cursor restore** — serialize state mid-session with `JSON.parse(JSON.stringify(...))`, deserialize, continue recording events; result matches the never-serialized run exactly.
3. **Seeds diverge** — two different seeds produce different phase tag sets for the same user (guards against the weighted sampling collapsing to top-5).
4. **Session pool ratio** — library 0.60 ±0.08, tasteMatch 0.25 ±0.08, trending 0.15 ±0.08.
5. **No repeated artist within a phase.**
6. **No repeated track within a session**, including after a replan.
7. **Intra-phase energy SD ≤ 0.15** for every phase.
8. **Recency weighting** — the last week's tag cluster in the fixture data ranks in the top 2 of the taste vector.
9. **Time-of-day nudge** — same history at 02:00 vs 08:00 yields different top tags.
10. **Early skip replans** — capture upcoming track IDs, fire an early skip, assert upcoming changed and `playedTrackIds` did not lose anything.
11. **Late skip does not re-weight** — `tagWeightAdjustments` unchanged after a skip at 85%.
12. **Two early skips in a phase truncate it** — and specifically with a **non-adjacent** pair (skip, complete, skip) so the rename is actually exercised.
13. **Null editorial note** — for every catalog track with `editorialNote === null`, `getContextCard(...).editorialText` is strictly `null`, never `''` or a fallback string, and `reasonLine` is still non-empty.
14. **Purity** — `Object.freeze` the input state deeply; `recordEvent` does not throw and returns a different object.
15. **Serializable** — `JSON.parse(JSON.stringify(state))` round-trips with no loss.
16. **P2 attribution** — a `friendPlaylist` session's cards carry `attribution`, and its phase tags differ from a `default` session on the same seed.
17. **Metrics** — a scripted session (2 completes, 1 early skip, 1 save) produces the arithmetically expected `SessionMetrics`.

---

## Demo harness

`CLAUDE.md` forbids adding dependencies without asking, and there's no TS runner installed that can execute a standalone script with the `@/` alias. So implement the demo as a **Vitest file that prints**, which costs no new dependency, resolves aliases through the existing Vite config, and doubles as a regression test:

`src/dj/__tests__/demo.session.test.ts`, wired as:

```json
"dj:demo": "vitest run src/dj/__tests__/demo.session.test.ts --reporter=verbose"
```

`npm run dj:demo` must print:

- Each phase: index, name, dominant tag, target energy, status — then its tracks as `title — artist — bucket — energy`.
- The realized session-level pool ratios.
- Then a scripted run: complete 2 tracks, early-skip the 3rd, early-skip the 4th — followed by the full event log and the replanned upcoming queue.
- Finally, the computed `SessionMetrics`.

Run it and paste the output when you're done. **If you'd prefer a real CLI script, ask me first** — that needs a new dependency.

---

## Permitted changes outside `src/dj/`

Only these:

- `package.json` — add the `dj:demo` script.
- `src/lib/storage.ts` — add `loadSessionState()` / `saveSessionState(state)` alongside the existing helpers, using the same `'muse:'` prefix and silent-failure pattern.
- `CLAUDE.md` — mark Phase 2 complete, record what actually shipped, and remove the `consecutiveSkipsInPhase` note once renamed.

Leave every component, view, context and data file untouched.

---

## Out of scope this phase

No React components, no DJ view, no debug panel UI, no styling, no audio, no backend, no network, no text-to-speech, no natural-language requests, no analytics or A/B infrastructure, no new dependencies. If you finish early, add test cases and deepen `PHASE_PHRASES` — do not start Phase 3.

---

## Definition of done

- All 17 tests pass. `npm run test`, `npm run build`, and `npm run lint` all clean.
- `npm run dj:demo` prints a coherent session with plausible phase names and in-tolerance ratios; running it twice with the same seed gives identical output.
- No React or DOM import anywhere in `src/dj/`; no `Math.random()` or `Date.now()` under `src/dj/`.
- `CLAUDE.md` updated per above.
- **Write `PHASE_2_NOTES.md`** at the repo root documenting: the public API with signatures, the RNG-cursor decision and how it works, every constant and where it lives, the `earlySkipsInPhase` rename, any deviation from this prompt and why, and what Phase 3 needs to know to wire the engine into `PlayerContext` (which already exposes `setDjPlayback`, `onTrackComplete`, `onTrackSkip` with `positionFraction`, and `demoSpeed`). Sessions get cleared between phases — write it for someone with no memory of this conversation.
- Finish with a short summary of what a Phase 3 prompt needs to contain.
