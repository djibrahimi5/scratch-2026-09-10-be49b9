# Phase 3 Notes — DJ View (P0 zero-input session)

Written for someone with no memory of the session that produced it. Phase 3 built the real `/dj`
view on top of the Phase 2 engine (`src/dj/`, untouched) and the Phase 1 shell. No seeding UI, no
debug panel, no real audio, no new dependencies.

## Component tree and ownership

```
DjView (src/views/DjView.tsx)
├─ no session            → DjIdle
├─ session.status ended  → SessionSummary
└─ session.status active
   ├─ PhaseBanner    — persistent phase name/position row + transient transition/cut-short toast
   ├─ DjNowPlaying   — large art/title/artist, its own transport (play/pause/skip/save)
   ├─ ContextCard    — sourced commentary: editorialText verbatim or fixed no-note chrome
   └─ UpNextQueue    — remaining tracks grouped by phase, with phase status badges
```

`NowPlayingBar` (bottom bar, Phase 1) is untouched and keeps rendering throughout — `DjNowPlaying`
is a larger, supplementary control surface for the DJ view, not a replacement.

## Provider placement

`DjSessionProvider` (`src/state/DjSessionContext.tsx`) is nested inside `PlayerProvider`, both of
which sit inside `LibraryProvider`, all wrapped around `<App>` in `src/main.tsx` (via
`AppProviders`) — above the router entirely. This is why acceptance check 7 (start a session,
browse Library, come back to `/dj`) works: navigating between routes never unmounts the provider,
so the session and its player-callback registrations stay live the whole time.

## Player wiring and persistence

`DjSessionContext` registers `player.onTrackComplete`/`onTrackSkip` once (deps are the
individually-stable `onTrackComplete`/`onTrackSkip` functions, destructured out of `player` so the
effect never references the whole `player` object — that object is a new reference on every
playback tick, since `PlayerContext`'s memoized value depends on `positionSec`). Both handlers call
a stable `applyEvent(event)` that updates session state via the functional-updater form
(`setSession(prev => recordEvent(prev, event))`), so they never close over stale session state.

Advancing to the next track is **not** done inside that updater. `applyEvent` only stashes
`{ nextId: nextUnplayedTrackId(next) }` into a ref when the event was a `trackComplete`/`skip`; a
separate effect (keyed on the committed `session`) drains that ref and calls
`player.setDjPlayback(nextId)` followed by a `trackStart` event — or, if there's no next track,
`endSession`. This split matters because `recordEvent`'s cut-short branch updates
`currentPhaseIndex` immediately but leaves `currentTrackIndex` stale until the *next* `trackStart`
arrives — the advance effect firing that `trackStart` synchronously, right after every skip or
complete, is what keeps that window as short as one render.

Persistence is a plain `useEffect(() => { if (session) saveSessionState(session) }, [session])` —
deliberately not inside the `setSession` updater. React (dev-only, under `StrictMode`)
double-invokes updater functions to surface impurities; an effect only ever runs against what was
actually committed and rendered, so persisted state can never diverge from what's on screen. The
same effect carries the dev-only invariant check (`savedThisSession` vs. `library.isInLibrary`).

## The next-track scan

`unplayedFrom(state, exclude)` / `nextUnplayedTrackId(state)` live privately in
`DjSessionContext.tsx`, not in `src/dj/` — they only read fields already public on `SessionState`
(`playedTrackIds`, `phases`, `currentPhaseIndex`), need no engine-internal knowledge, and the brief
only asks for an engine addition "if genuinely needed." They scan `playedTrackIds` (the only
append-only, always-consistent field) starting at `currentPhaseIndex`, rather than trusting
`currentTrackIndex` — see above for why that index can be transiently stale. Two variants exist
(`exclude: null` for "what's next", `exclude: currentTrackId` for "what's queued") because
`playedTrackIds` only grows on `trackComplete`/`skip`, never on `trackStart` — a single scan would
otherwise list the currently-playing track as also "up next."

`currentTrackOf(state)` (also private) reads `phases[currentPhaseIndex].plannedTrackIds[currentTrackIndex]`
directly — safe to use as the session's own idea of "current track" because `trackStart` sets both
indices correctly in the same call, and it's only ever read right after a `trackStart` has already
landed (at session creation, and during resume — see below).

## DEMO_SEEDS

Runtime seeds are drawn from a fixed, rotating `DEMO_SEEDS = [1, 2, 3, 4, 5]` (never
`Math.random()`) because `PHASE_2_NOTES.md` documents that the 120-track catalog only keeps the
session-level pool ratio within tolerance for these five seeds. The rotation cursor is **not** a
new piece of state: it's derived at mount from the pre-existing, previously-unused
`loadLastSession()`/`saveLastSession()` pair in `storage.ts` (added in an earlier phase, `{ seed,
seedSource, startedAt }`, never wired to anything until now). `startSession()` calls
`saveLastSession` after creating a session, and the next mount picks up where the rotation left
off. This avoids adding a new storage key or touching `storage.ts` at all — both were preferred
given `storage.ts` is otherwise complete and out of scope this phase. The brief's "define
`DEMO_SEEDS` in the DJ layer" is interpreted here as this provider (the Phase 3 feature layer), not
`src/dj/` — the constant has zero engine relevance, and `src/dj/` changes are reserved for
genuinely-needed pure selectors.

## Save (two-call pattern)

`saveCurrent()` calls `library.addToLibrary(trackId)` **and** dispatches a `save` `DJEvent` via
`recordEvent` — both are required because `recordEvent`'s `save` branch deliberately never touches
`LibraryContext`. `isSaved(trackId)` reads `library.isInLibrary`, not `session.savedThisSession`,
since a track can be in the library independent of anything the DJ did this session; the two
questions ("is this in my library" vs. "did I save this during this session") are answered from
different fields on purpose — `SessionSummary` renders `savedThisSession` directly for the latter.

## Resuming a session after a full reload

`PlayerContext` resets to its defaults (`mode: 'manual'`, `currentTrackId: null`) on a full browser
reload; it has no persistence of its own. `SessionState` does persist (`loadSessionState()`), so on
mount `DjSessionContext` restores an `active` session into state immediately — but without also
syncing `PlayerContext`, the view would show "nothing playing" for an already-active session.

A one-time `useLayoutEffect` (guarded by a ref so it survives `StrictMode`'s dev-only double-invoke
without double-toggling playback) handles this: it computes the resumed track via `currentTrackOf`,
calls `player.setDjPlayback(trackId)` — which always starts playback — immediately followed by
`player.togglePlay()`. Both calls land in the same synchronous batch, and React applies queued
updates to the same state variable in order, so the final committed `isPlaying` is `false`. There's
no "load without playing" primitive on `PlayerContext`, and `PlayerContext` was out of scope to
change, so this is a deliberate use of the existing primitives rather than a new one.
`usePlaybackTimer` already resets `positionSec` to 0 whenever the track key changes, so the resumed
track correctly shows at position 0, paused — exact elapsed position is not persisted or restored
(not required, and there's nowhere in `SessionState` that stores it).

A loaded session with `status: 'ended'` is treated as no session (`DjIdle`) rather than resurrected
into `SessionSummary` on every future reload — the brief only specifies restore behavior for
`'active'`.

## Deviation: no "resume" button in DjIdle

The brief describes `DjIdle` showing a secondary "Resume session" option when a persisted active
session exists. Given the mount-time restore above, `session` is never `null` when a persisted
active session exists, so `DjView` never renders `DjIdle` in that case at all — the user lands
directly on the active session view, paused, exactly matching acceptance check 6 ("resumes at the
right track without auto-playing") without an extra click. `DjIdle` was simplified to a single
"Start session" action; the resume path doesn't need separate UI.

## Deviation: SessionSummary's completed-phase count

Verified directly against the real engine (a throwaway script driving `createSession`/`recordEvent`
through a full natural session, since no browser was available this session — see Testing below):
the **last** phase of a session that finishes naturally is never marked `'completed'`. `recordEvent`
only flips a phase to `'completed'` when the *next* phase's `trackStart` fires; there is no phase
after the last one to trigger that transition, so it's left at `'active'` even though every one of
its tracks has played and the session has ended. This is confirmed engine behavior, not a bug —
`src/dj/` was not touched. `SessionSummary.tsx` accounts for it directly: a phase counts as
completed if its status is `'completed'`, or if it's still `'active'` while `state.status ===
'ended'` (which only happens once every planned track across every phase has been played).

## Other small deviations

- `PhaseBanner`'s transient toast renders the engine's own `SessionEvent.message` verbatim rather
  than reconstructing separate UI copy — one source of truth, no risk of the banner text drifting
  from what actually happened.
- The player-callback registration effect destructures `onTrackComplete`/`onTrackSkip` out of
  `player` into locals before the effect, rather than depending on `player.onTrackComplete`
  directly in the dependency array. Functionally identical, but oxlint's `exhaustive-deps` check
  flagged the member-expression form as "missing dependency: player" (which would have forced
  either including the whole unstable `player` object or an inline suppression); destructuring
  gives the linter plain identifiers it can verify.

## What's in `src/dj/` — nothing changed

No file under `src/dj/` was modified. `getDebugSnapshot` is not imported anywhere in Phase 3 (the
debug panel is Phase 5). The only engine functions used are `createSession`, `recordEvent`,
`getContextCard`, and `computeMetrics` (the last only inside `SessionSummary`).

## Testing

The Chrome browser automation tool was unavailable in this session (the user declined the
extension), so the acceptance checks could not be visually confirmed end-to-end in a live browser.
What was verified:

- `npm run build`, `npm run test` (27 pre-existing engine tests, untouched, still pass), and
  `npm run lint` are all clean (lint shows only the same `react(only-export-components)` pattern
  already present on `PlayerContext.tsx`/`LibraryContext.tsx`, which `DjSessionContext.tsx` now
  shares by the same convention — no new warning categories).
- A temporary, non-permanent script (deleted after use, never committed) drove the real
  `createSession`/`recordEvent` engine functions through: a full natural session to completion, the
  two-early-skip cut-short sequence (specifically re-deriving the queue during the transient gap
  between the cut-short `skip` and the following `trackStart`, to confirm the scan never returns a
  track from the just-cut phase), and a save event's independence from playback indices. This is
  what surfaced the last-phase-never-`completed` behavior above.
- Every acceptance-check flow was traced by hand against the final component/provider code.

**Recommended before recording the demo:** a manual click-through of all 9 acceptance checks in a
real browser, since React rendering, CSS layout, and the exact timing of `StrictMode`'s effects
under real browser paint were not exercised.

## What Phase 4 (P1 + P2 seeding) needs

- `startSession()` currently always creates a session with `seedSource: { kind: 'default' }`. Phase
  4's "Start from…" entry points will need either a parameter on `startSession` (e.g.
  `startSession(seedSource?: SeedSource)`) or a new context method, so a song/artist/library/
  playlist/friend-playlist choice can flow into `createSession`.
- `DEMO_SEEDS`/rotation logic is unaffected by seed source — it only decides the numeric RNG seed,
  which is orthogonal to `seedSource`. Phase 4 can reuse it as-is.
- Card attribution is already rendered by `ContextCard` (`card.attribution`) — it was simply never
  populated in P0 (only `friendPlaylist` sessions set it). No component change needed there.
- `PHASE_2_NOTES.md`'s caveat still applies: pool-ratio tolerance is only verified for seeds 1–5.
  A seeded (P1/P2) session biases the taste vector and phase-1 tag but still draws from the same
  `DEMO_SEEDS` pool for its numeric seed, so this should continue to hold — but re-verify once
  seeding is wired up, since seeded taste vectors could plausibly shift bucket eligibility.
