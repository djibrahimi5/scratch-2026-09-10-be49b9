# Phase 4 Notes — P1/P2 Seeded DJ Sessions

Read this if you're starting Phase 5 (debug panel + polish) with no memory of this session. Phase 4 added the ability to start a DJ session pointed at a song, an artist, the user's library, a playlist, or a friend's playlist, on top of the already-complete P0 zero-input session (Phase 3). The engine (`src/dj/`) already supported all six `SeedSource` kinds before this phase started — Phase 4 is UI and wiring only.

## What shipped

- `startSession(seedSource?: SeedSource)` on `DjSessionContext` — optional, defaults to `{ kind: 'default' }`, so every pre-existing zero-arg call site (`DjIdle`'s primary button, `SessionSummary`'s restart button) keeps working unchanged.
- `seedLabel: string | null` on the context value — a human-readable description of the active session's seed (song title, artist name, `"Your library"`, playlist title, or friend's playlist title), `null` for a default session. Derived via a new exported `resolveSeedLabel(seedSource)` function in `DjSessionContext.tsx`.
- `SeedPicker` (`src/components/dj/SeedPicker.tsx`) — a "Start from…" modal with five sections (song search, artist list, library, playlists, friend's playlist), opened from a new secondary action on `DjIdle`. Selecting any row calls `startSession(seedSource)` and closes the picker.
- `SeedBadge` (`src/components/dj/SeedBadge.tsx`) — a small "Seeded from {label}" chip, rendered nowhere when `seedLabel` is `null`.
- `SessionSummary` now shows "Seeded from {label}" under its headline stat, without touching the completed/cut-short phase counting logic.
- `PlaylistDetailView` has a new "Start a DJ session from this playlist" button that calls `startSession({ kind: 'playlist', playlistId })` and navigates to `/dj`.
- `src/dj/__tests__/seeded-pool.test.ts` (new) — verifies the session-level pool ratio for all 6 `SeedSource` kinds × all 5 `DEMO_SEEDS` (30 cases).

## `startSession` — every call site

- `src/views/DjView.tsx` — unchanged, zero-arg calls (`DjIdle onStart={dj.startSession}`, `SessionSummary onRestart={dj.startSession}`). Both keep compiling because TypeScript allows passing a function with an optional parameter wherever a `() => void` is expected.
- `src/components/dj/SeedPicker.tsx` — new call site, `dj.startSession(seedSource)` for each of the five non-default kinds a user can pick.
- `src/views/PlaylistDetailView.tsx` — new call site, `dj.startSession({ kind: 'playlist', playlistId })`, immediately followed by `navigate('/dj')`.

`DEMO_SEEDS` rotation logic was not touched — it stays keyed purely off `loadLastSession()`/`saveLastSession()`, orthogonal to which `SeedSource` was used.

## Where `seedLabel` lives, and why

`resolveSeedLabel` is a plain exported function inside `src/state/DjSessionContext.tsx`, not in `src/dj/`. It only needs `SessionState['seedSource']` plus static `@/data` lookups (`CATALOG.tracksById`, `CATALOG.artistsById`, `PLAYLISTS`, `FRIEND`) — no engine-internal knowledge — so it belongs at the same level as the file's other private helpers (`currentTrackOf`, `unplayedFrom`). It's exported (rather than kept private) solely because `SessionSummary.tsx` also needs it, and duplicating the same `switch` in two files risked the two labels drifting apart on a future copy change.

`seedLabel` on the context value is `useMemo(() => (session ? resolveSeedLabel(session.seedSource) : null), [session])`. No new persistence was needed: `session.seedSource` already round-trips through `localStorage` via the existing `SessionState` JSON serialization, so the label is correct immediately after a reload (once the existing mount-time resume path restores `session`) and after navigating away and back (the provider sits above the router, unchanged from Phase 3).

## Why `SeedBadge` lives inside `DjNowPlaying`, not `PhaseBanner`

The brief asked for the badge "alongside the phase name and position." In the actual component tree (`src/views/DjView.tsx`), `PhaseBanner` (phase name) and `DjNowPlaying` (now-playing + position) are rendered as **siblings**, not nested — and neither `DjView.tsx` nor `PhaseBanner.tsx` is in this phase's permitted-edit list. So `SeedBadge` is mounted inside `DjNowPlaying`, which sits immediately below `PhaseBanner` in the visual stack — this reads as "near the phase name" without requiring an out-of-scope edit. `DjNowPlaying` fetches `seedLabel` itself via `useDjSession()` (it did not previously import this hook) rather than taking a new prop, following the precedent already set by `UpNextQueue`, which also reaches into `useDjSession()` directly for `isSaved` despite receiving other props from `DjView`.

## Seeded pool-ratio test results

`src/dj/__tests__/seeded-pool.test.ts` checks all 6 `SeedSource` kinds (`default`, `song`, `artist`, `library`, `playlist`, `friendPlaylist`) × all 5 `DEMO_SEEDS` (`1`–`5`) — 30 cases total, using one representative fixture per kind (`CATALOG.tracks[0]` for `song`, `ARTISTS[0]` for `artist`, `PLAYLISTS[0]` for `playlist`, `FRIEND.id` for `friendPlaylist`).

**Result: all 30 cases pass within the existing `POOL_TOLERANCE` (0.08) with no exceptions needed.** The `KNOWN_FAILING` allowlist in the test file is empty. The risk both `PHASE_2_NOTES.md` and `PHASE_3_NOTES.md` flagged — that a seeded taste-vector blend (70/30 or the inverted 70/30 friend blend) plus a forced phase-1 tag might shift which tracks are eligible for the `tasteMatch`/`trending` buckets enough to blow the tolerance — did not materialize for these seeds and fixtures. No `src/dj/` engine changes were made or needed.

This does not prove every possible seed choice is safe — only the one representative fixture per kind was tested, at the five `DEMO_SEEDS` values the app actually uses. If Phase 5 or later work introduces new demo seeds, or the `SeedPicker`'s song/artist/playlist choices matter more granularly than "which kind was picked" (untested assumption — see below), re-run this suite with the new values before relying on it.

**Assumption worth flagging**: the test keys `KNOWN_FAILING` entries (if any were ever needed) by `(kind, seed)`, not by the specific track/artist/playlist ID. This assumes the *kind* of seed and the *tag profile it pulls in aggregate* dominates any pool-ratio shift, not the literal ID chosen within that kind. That held for the one fixture tested per kind; it wasn't stress-tested across multiple songs/artists/playlists.

## Deviations from the brief

- **`PlaylistDetailView`'s `playlist!.id` non-null assertion**: the brief's plan draft expected TypeScript to narrow `playlist` inside the nested `handleStartFromPlaylist` function after the early `if (!playlist) return` guard, since `playlist` is a `const`. In practice, `tsc` does not narrow a `const` captured by a nested closure this way (TS18048: 'playlist' is possibly 'undefined') — control-flow narrowing doesn't extend into function bodies defined later in the same scope, even for consts. The assertion `playlist!.id` was kept; it's safe because `handleStartFromPlaylist` is only reachable from the button's `onClick`, which only renders in the branch where the earlier guard has already passed.
- Everything else matches the approved plan with no further deviation.

## What Phase 5 needs to know

- The debug panel (`src/components/debug/`, not yet built) should be able to read `session.seedSource` directly off `SessionState` for display — no new engine API is needed, it's already on the type.
- `DebugSnapshot` (in `src/dj/types.ts`) already embeds `seedSource`, so a debug panel reading `getDebugSnapshot(state)` gets it for free.
- The seeded pool-ratio result (all green, no known exceptions) means Phase 5 doesn't need to steer the demo away from any particular seed kind or `DEMO_SEEDS` value on stage — every combination tested is safe.
- `SeedPicker`'s modal is a plain `fixed inset-0` overlay with no animation — Phase 5's polish pass is the right place to add enter/exit transitions if desired, along with the rest of the app's transition/empty-state polish.
- No new dependencies were added in this phase.
