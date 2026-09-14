# CLAUDE.md — Muse (AI DJ prototype)
 
Read this first, every session. It is the master context for the project.
 
## What this is
 
**Muse** is a mock music-streaming web app that emulates Apple Music's visual language and interaction model. It exists for one reason: to make an **AI DJ** feature interactive and demoable as a product-management portfolio piece. The app is the stage; the DJ is the show.
 
It implements a real PRD. The DJ autonomously builds an evolving, themed listening session from the user's own taste with **no input required** (P0), with optional user-seeded (P1) and friend-seeded (P2) modes.
 
## Non-negotiable product rules
 
These come from the PRD's explicit non-goals. Violating one silently breaks the point of the project.
 
1. **Commentary is sourced, never generated.** Every context card draws on `track.editorialNote`, which is authored data. ~15% of the catalog has `editorialNote: null` **on purpose**. When it is null, the card shows only the scoring-derived reason line and **no editorial text**. Never invent, template, generate, or fall back to substitute editorial prose. If you find yourself writing a default string for the missing-note case, stop — the correct behavior is the absence of text.
2. **No synthetic host persona.** No generated banter, no text-to-speech, no voice, no first-person DJ character.
3. **No Apple branding.** No Apple logos, wordmarks, app icons, or real album artwork. No real artists, songs, or albums — the entire catalog is invented. Album art is procedural (`src/lib/proceduralArt.ts`). The `ConceptBadge` component displays "Concept prototype — not affiliated with Apple" and must stay visible.
4. **No real audio.** Playback is simulated by a timer (`src/hooks/usePlaybackTimer.ts`).
5. **No backend, no network calls, no auth.** All data is local; the only persistence is `localStorage` via `src/lib/storage.ts`.
6. **Do not add dependencies without asking.**
## Stack and commands
 
Vite 8 + React 19 + TypeScript 6 + Tailwind CSS v4 + React Router 7. Vitest for tests, oxlint for linting.
 
```
npm run dev          # dev server
npm run build        # tsc -b && vite build
npm run test         # vitest run
npm run test:watch
npm run lint         # oxlint
```
 
## Conventions
 
- **Path alias `@/` → `src/`.** Configured in both `vite.config.ts` and `tsconfig.app.json`. Use it; avoid long relative chains.
- **Named exports only.** No default exports anywhere, including components.
- **`verbatimModuleSyntax` is on** — type-only imports must be written `import type { X } from '...'`.
- **`erasableSyntaxOnly` is on** — no `enum`, no `namespace`, no constructor parameter properties. Use `as const` object literals and derived union types (see `src/data/tags.ts` for the house pattern).
- **`noUnusedLocals` / `noUnusedParameters` are on** — dead bindings fail the build.
- **Tailwind v4 with `@theme` tokens** in `src/index.css`. The accent is `--color-accent: #fa243c`, used as `text-accent` / `bg-accent`. Dark UI throughout: `bg-neutral-950` ground, `text-neutral-100` body, `text-neutral-500` secondary.
- **Vitest runs in the `node` environment with `globals: true`.** Engine tests must not require a DOM.
- Tests live in `__tests__/` folders beside the code they cover.
## Repo map
 
```
src/
  data/           invented catalog — the single source of truth for content
    tags.ts       TAG_IDS (10 tags), ERA_IDS (6 eras), type guards
    types.ts      Track, Artist, Album, UserProfile, PlayHistoryEntry, FriendProfile, Playlist
    tracks/       120 tracks split by era (era70s … era20s)
    artists.ts albums.ts playlists.ts
    user.ts       LIBRARY, PLAY_HISTORY, BASELINE_SKIP_RATE, USER
    friend.ts     FRIEND (Jordan) + "Jordan's Morning Mix"
    index.ts      CATALOG (arrays + byId Maps) — import from '@/data'
    __tests__/catalog.test.ts   data-integrity invariants
  dj/             DJ ENGINE — pure logic, no React, no DOM  (Phase 2)
    types.ts      already written; canonical (see below)
  lib/
    prng.ts       mulberry32, createRng, rngPick/rngShuffle/rngWeightedPick/rngInt/rngFloat
    time.ts       daysBetween, timeOfDay
    storage.ts    localStorage helpers, 'muse:' prefixed, schema-versioned
    format.ts proceduralArt.ts
  state/
    PlayerContext.tsx    playback + demo speed + DJ playback hooks
    LibraryContext.tsx   library membership + additions
    AppProviders.tsx
  hooks/usePlaybackTimer.ts
  components/     album/ debug/ dj/ layout/ track/
  views/          HomeView, NewView, RadioView, SearchView, library/*, PlaylistDetailView, DjView
```
 
## Data model (canonical)
 
`Track = { id, title, artistId, albumId, durationSec, tags: TagId[], era, energy, popularity, editorialNote: string | null }`
 
Tag vocabulary (exactly these ten): `late-night`, `sunrise`, `driving`, `focus`, `heartbreak`, `euphoric`, `warm-up`, `wind-down`, `crate-digging`, `anthem`. Eras: `70s`–`20s`.
 
Invariants enforced by `catalog.test.ts` — 24 artists, 30 albums, 120 tracks; 12–18% of tracks have `editorialNote: null`; 2–4 tags per track; `energy`/`popularity` in [0,1]; `durationSec` in [150,320]; all IDs resolve; no duplicate track IDs. **If you change catalog data, these tests must still pass.**
 
The fixture data is deliberately shaped for the demo: the user's library and older history skew to `late-night` / `focus` / `crate-digging` / `driving`, the last week's history shifts toward a different cluster (so recency weighting is visibly doing something), and Jordan's playlist skews to `sunrise` / `anthem` / `warm-up` (so a friend-seeded session reads as obviously different).
 
## DJ engine contract
 
**`src/dj/types.ts` already exists and is canonical.** Any spec, prompt, or document that names these differently is out of date — follow the file. In particular:
 
- Pool buckets are `PoolSourceLabel = 'library' | 'tasteMatch' | 'trending'`.
- `SeedSource` kinds are `'default' | 'song' | 'artist' | 'library' | 'playlist' | 'friendPlaylist'` — note `playlist` carries `playlistId` and `friendPlaylist` carries `friendId`, not raw track ID arrays.
- `SessionEvent = { type, atMs, message, data? }` over a fixed `SessionEventType` union.
- `SessionState`, `Phase`, `PhaseStatus`, `ScoredTrack`, `TasteVector`, `SessionMetrics` are all already defined.
Public API to be added in `src/dj/index.ts` (Phase 3+ imports **only** from here):
 
```ts
createSession(input): SessionState
recordEvent(state: SessionState, event): SessionState   // PURE — never mutates input
getContextCard(state, trackId): ContextCard
getDebugSnapshot(state): DebugSnapshot
```
 
`SessionState` must stay **JSON-serializable** (it round-trips through `localStorage`), so it cannot hold a closure. Resolved in Phase 2: `SessionState.rngCursor` is a numeric draw count, rebuilt into a generator on demand (see `src/dj/rng-cursor.ts`); the old `consecutiveSkipsInPhase` field is renamed `earlySkipsInPhase` and correctly counts non-adjacent early skips within a phase. See `PHASE_2_NOTES.md` for details.
### Tuning constants
 
Put these in `src/dj/constants.ts` so the debug panel and docs can reference one place.
 
| Constant | Value |
|---|---|
| Recency weights | ≤7 days ×3, ≤30 days ×2, older ×1 |
| Incomplete play | counts at half weight |
| Time-of-day nudge | ×1.25 on matching tags (`timeOfDay()` buckets: morning → `sunrise`/`warm-up`, day → `focus`/`driving`, evening → `euphoric`/`anthem`, late-night → `late-night`/`wind-down`) |
| Session shape | 5 phases × 4–6 tracks |
| Phase energy arc | [0.45, 0.60, 0.75, 0.60, 0.40] |
| Pool ratio (session-level) | library 60% / tasteMatch 25% / trending 15%, ±0.08 |
| Early-skip threshold | `positionFraction < 0.20` |
| Early skip | tag weights ×0.6, then replan all unplayed tracks |
| Late skip | logged only, no re-weighting |
| Complete | tag weights ×1.15 |
| Phase truncation | 2 early skips within a phase |
| Intra-phase energy | standard deviation ≤ 0.15 |
| P1 seed blend | 70% user / 30% seed |
| P2 friend blend | 70% friend / 30% user |
 
### Determinism (hard requirement)
 
Nothing in `src/dj/` may call `Math.random()` or `Date.now()`. The seed and a `now: Date` are injected through `createSession`. Use the helpers in `@/lib/prng`. The same seed + same inputs + same event sequence must produce a deeply equal session. This is what makes the demo reproducible on stage, and there is a test for it.
 
Phase-tag selection uses **weighted sampling** from the taste vector, not a deterministic top-5 — otherwise every session for a given user is identical and the demo is dead.
 
## Playback integration (already built — Phase 3 uses this, doesn't rebuild it)
 
`PlayerContext` already supports DJ mode:
 
- `setDjPlayback(trackId)` — switches `mode` to `'dj'` and starts a track.
- `onTrackComplete(handler)` / `onTrackSkip(handler)` — register callbacks; in DJ mode the player routes completion and skips to them. `onTrackSkip` supplies `positionFraction`, which maps directly to the early/late skip rule.
- `skipCurrent()`, `togglePlay()`, `demoSpeed` / `setDemoSpeed(1 | 10 | 60)`.
`LibraryContext` provides `libraryIds`, `isInLibrary(trackId)`, `addToLibrary(trackId)` — this is what a DJ "save" writes to, and what the save-rate metric reads.
 
## Build phases
 
1. **Shell** — ✅ complete. Sidebar, routing, Home/Library/Search/New/Radio, now-playing bar, catalog, procedural art, simulated playback with demo speed. `DjView` is a placeholder.
2. **DJ engine** — ✅ complete. `src/dj/` (`constants.ts`, `rng-cursor.ts`, `taste.ts`, `phases.ts`, `pool.ts`, `reasons.ts`, `session.ts`, `index.ts`) with 27 passing unit tests and a headless `npm run dj:demo` script. No UI. Public API (`createSession`, `recordEvent`, `getContextCard`, `getDebugSnapshot`, `computeMetrics`) is exported from `src/dj/index.ts` only. See `PHASE_2_NOTES.md` for the full API, the RNG-cursor mechanism, and what Phase 3 needs to know.
3. **DJ view (P0)** — ✅ complete. `src/state/DjSessionContext.tsx` (new provider, nested inside `PlayerProvider` in `AppProviders`, above the router) drives the engine; `src/components/dj/` (`DjIdle`, `DjNowPlaying`, `ContextCard`, `PhaseBanner`, `UpNextQueue`, `SessionSummary`) plus a full `DjView.tsx` rewrite. Zero-input session start (rotating through a fixed `DEMO_SEEDS = [1..5]`, never `Math.random()`), phase transitions and cut-short both surfaced via a transient banner, sourced context cards (editorial text verbatim or fixed no-note chrome, never generated), skip/save wired through `PlayerContext`/`LibraryContext`, and full reload-mid-session resume without auto-play. `src/dj/` was not modified. See `PHASE_3_NOTES.md` for the provider architecture, the two engine hazards it works around (stale `currentTrackIndex` after a cut-short; ref-based player callbacks), and deviations from the original brief.
4. **P1 + P2 seeding** — ✅ complete. `DjSessionContext.startSession` now takes an optional `SeedSource` (defaults to `{ kind: 'default' }`) and exposes `seedLabel`; `SeedPicker.tsx` ("Start from…", opened from a secondary action on `DjIdle`) offers a song, an artist, the library, a playlist, or Jordan's playlist; `SeedBadge.tsx` shows the active seed (mounted inside `DjNowPlaying`, since neither `DjView.tsx` nor `PhaseBanner.tsx` were in scope this phase); `SessionSummary` shows what a session was seeded from; `PlaylistDetailView` gained a "Start a DJ session from this playlist" entry point. `src/dj/` was not modified — a new `seeded-pool.test.ts` verified the session-level pool ratio holds within tolerance for all 6 seed kinds × all 5 `DEMO_SEEDS` with zero exceptions needed. See `PHASE_4_NOTES.md` for the full write-up.
5. **Debug panel + polish** — ✅ complete. `src/components/debug/DebugPanel.tsx` + `TasteVectorChart.tsx`: a read-only, production-build-safe slide-over (opens with Ctrl+K/Cmd+K or the always-visible corner toggle, mounted in `AppShell`) showing everything `getDebugSnapshot` returns — seed/RNG cursor, base-vs-live taste vector bars, the five-phase plan with pool breakdowns, session pool ratio against `POOL_TARGET`/`POOL_TOLERANCE`, substitutions, the PRD guardrail metrics (save rate, skip-rate gap, editorial coverage), and the full event log. Plus a polish pass: "AI DJ" → "DJ" in the two user-facing eyebrows (positioning: don't lead with "AI"), `SeedPicker` gained transitions/Escape/click-outside/focus management, icon-only controls got `aria-label`s, a global focus-visible ring, empty states for the up-next queue/`DjIdle`/library views, and restrained fade transitions on the phase-transition toast, context card, and (most importantly for the demo) the up-next queue after a replan. `src/dj/` and `src/data/` were not touched. See `PHASE_5_NOTES.md` for exactly what was verified in a real browser versus reasoned/engine-traced (no browser was available this session either) and one pre-existing, unrelated `src/dj/` test fragility that was flagged rather than worked around.

## Project status: complete

All five phases have shipped. The app is a full click-through demo: a mock Apple-Music-style shell
(Home/New/Radio/Search/Library/Playlists) wrapped around the real deliverable, an autonomous DJ
that builds a five-phase, taste-adaptive listening session with zero input, adapts live to skips
and saves, and can optionally be seeded from a song/artist/library/playlist/friend's playlist. A
read-only debug panel (Ctrl+K / Cmd+K, or the corner toggle, from any screen) exposes the engine's
internals — pool ratios, taste-vector adaptation, the adaptation log, and the PRD's guardrail
metrics — as a demoable product spec, not just a working feature.

To run the acceptance demo: `npm run dev`, open the app, and follow `DEMO_SCRIPT.md` beat-by-beat
(it mirrors "The acceptance demo" section below with exact clicks and timing). `README.md` has the
short version for anyone opening this repo cold.

**Each phase runs in a fresh session.** Stay inside the current phase's scope; do not start the next one.
 
## Session handoff protocol
 
Sessions are cleared between phases, so the repo is the only memory.
 
At the end of every phase: update the phase list above with what actually shipped, note any deviation from this document (and fix the document), and leave a short `PHASE_N_NOTES.md` or module-level doc covering the public API and anything the next phase needs to know. Write it for someone with no memory of the conversation that produced it.
 
## The acceptance demo
 
The project "works" when this runs end to end with no code changes:
 
Open the app → tap **DJ** → a session starts with a phase name and a sourced context card → set demo speed to 10× → the session progresses through a visible phase transition → skip two tracks early in a phase → the phase cuts short and the queue visibly re-plans → save a non-library track the DJ surfaced and see it appear in Library → open the debug panel and see pool ratios, the adaptation log, and live save-rate and skip-gap numbers → start a new session seeded from Jordan's playlist and see different phase themes with friend attribution on the cards.
 
## Permanently out of scope
 
Real audio, A/B test or churn infrastructure, cohort assignment, sign-in, social features beyond the single friend profile, offline support, a settings page, mid-session natural-language requests, and any form of synthetic voice.