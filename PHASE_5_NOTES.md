# Phase 5 Notes — Debug Panel, Polish, Demo Readiness

Written for someone with no memory of this session. Phase 5 is the last phase: a read-only PM
debug panel, an interaction/accessibility/empty-state/layout polish pass, and demo-readiness
artifacts (`README.md`, `DEMO_SCRIPT.md`, this file). `src/dj/` and `src/data/` were not touched;
no dependencies were added.

## Part A — Debug panel

`src/components/debug/DebugPanel.tsx` (state, keyboard shortcut, corner toggle, slide-over shell)
and `src/components/debug/TasteVectorChart.tsx` (the base-vs-live bar chart). Mounted once in
`AppShell.tsx`, next to `<ConceptBadge />`, so it's on every route and stays mounted across
navigation — same reasoning `PHASE_3_NOTES.md` gives for why `DjSessionProvider` sits above the
router.

**Where every value comes from**, all read via `getDebugSnapshot(dj.session)` (from `@/dj`) except
where noted — the panel never imports or calls `recordEvent`, `addToLibrary`, or anything from
`usePlayer()`:

| Panel section | Source |
|---|---|
| Seed / RNG cursor / seed label | `snapshot.seed`, `snapshot.rngCursor`, `resolveSeedLabel(snapshot.seedSource)` (the existing exported helper in `DjSessionContext.tsx`, already used by `SeedBadge`/`SessionSummary`) |
| Taste vector bars | `snapshot.baseTasteVector` vs `snapshot.tasteVector`, all 10 `TAG_IDS`, scaled against the larger of the two vectors' max value |
| Phase plan | `snapshot.phases` — name, `dominantTag`, status, `poolBreakdown` |
| Pool ratio | `snapshot.sessionPoolRatio` compared to `POOL_TARGET`/`POOL_TOLERANCE`, imported directly from `@/dj/constants` (a read-only import — not an engine change) |
| Substitutions | `snapshot.substitutions` verbatim |
| Metrics | `snapshot.metrics` (`computeMetrics` under the hood), formatted with the existing `@/lib/format` helpers |
| Event log | `snapshot.eventLog`, rendered in its existing oldest→newest array order, so newest lands at the bottom of the scroll region without any reordering |

**Behavior notes:**
- Opens on `Ctrl+K` *and* `Cmd+K` (checked via `e.ctrlKey || e.metaKey`), closes on `Escape`, and has
  an always-visible corner toggle (`fixed top-4 right-4`) with `aria-expanded`/`aria-label`.
- No `import.meta.env.DEV` gating anywhere — verified it's absent from the file; it renders the
  same in `npm run build` output as in `npm run dev`.
- The panel is `fixed ... top-0 bottom-20 ...` (stops above the now-playing bar) rather than
  `inset-y-0`, specifically so it never covers `NowPlayingBar` or `ConceptBadge` and playback stays
  usable while it's open. It's always mounted (not conditionally rendered) and toggles via
  `translate-x-full`/`translate-x-0` so it doesn't need to reset any internal state on reopen.
- **The last-phase-never-`completed` quirk** (documented in `PHASE_3_NOTES.md`): the panel applies
  the same fix `SessionSummary.tsx` already uses — a phase still `active` when
  `session.status === 'ended'` displays as `completed*`, with a footnote explaining why. `src/dj/`
  was not touched to "fix" this; it's real, harmless engine behavior.
- Empty state (`!dj.session`): a one-line message instead of any snapshot content.

## Part B — Polish

**Naming:** `"AI DJ"` → `"DJ"` in `HomeView.tsx` and `DjIdle.tsx` (the only two occurrences —
grepped the whole `src/` tree after the change to confirm zero remain). Routes, file names, the
sidebar's `"✦ DJ"` link, and all internal identifiers are untouched.

**`SeedPicker`:** now takes `{ isOpen, onClose }` instead of being conditionally mounted by
`DjIdle`; `DjIdle` renders it unconditionally so enter/exit transitions have something to animate.
Added: opacity/scale transition on open/close, `Escape` to close, click-on-backdrop to close
(guarded by `e.target === e.currentTarget` so clicks inside the panel don't bubble into a close),
and focus management — the previously-focused element is captured in a ref when `isOpen` flips
true and refocused when it flips back to false, and the search input is focused on open (replacing
the old `autoFocus`, which wouldn't refire on reopen now that the component stays mounted).

**Icon-only buttons:** added `aria-label` (alongside existing `title` where present) to
`DjNowPlaying`'s play/pause/skip/save, `NowPlayingBar`'s play/pause (which previously had neither
`title` nor `aria-label`) and skip, `SeedPicker`'s close button, `DjIdle`'s start button, the new
debug toggle/close buttons, and `TrackRow`'s save button (touched while in the area, for
consistency — not explicitly named in the brief but the same issue).

**Focus visibility:** one global rule in `src/index.css` (`button, a, input, [tabindex]:focus-visible`
→ a 2px accent outline) rather than touching every component — smallest diff that gets a visible
ring on every interactive element against the dark ground.

**Empty/edge states:**
- `UpNextQueue.tsx` no longer `return null`s on an empty queue; it renders "Nothing left in the
  queue — this is the last track of the session." in the same card chrome. This is reachable during
  an active session (last track of the last phase playing, nothing left to scan), not only after
  `status: 'ended'` — `UpNextQueue` is never actually mounted once a session has ended (`DjView`
  swaps to `SessionSummary` at that point), so the brief's "when a session has ended" case doesn't
  literally occur in the current component tree; the in-session empty case does, and is what this
  fixes.
- `DjIdle.tsx` reads `loadLastSession()` once at mount and shows "Start another session" (plus a
  one-line mention of the prior seed, if any) instead of the first-time "Start a session" copy when
  a prior session exists in storage.
- Library views (`ArtistsView`, `AlbumsView`, `SongsView`, `RecentlyAddedView`) each got a
  "Your library is empty." fallback. Unreachable with the shipped fixture data (`USER.library` is
  never empty), added for defensiveness per the brief's explicit ask.
- `SearchView`'s existing "No results for …" state was left as-is — already correct, no gap to fix.

**Transitions** (`prefers-reduced-motion`-guarded `dj-fade-in` keyframe in `src/index.css`, ~200ms):
- `PhaseBanner.tsx`'s toast is now always rendered (not conditionally mounted) with visibility
  driven by opacity/translate off the existing `visible` boolean, so both the entrance and the exit
  actually animate. The message text is held in separate local state from `visible` so it doesn't
  blank out mid-fade-out.
- `ContextCard.tsx` gets the fade-in class; `DjView.tsx` passes `key={dj.currentTrackId}` so a
  track change remounts it and the animation replays — the simplest way to get a per-track
  transition without a crossfade state machine.
- `UpNextQueue.tsx`'s track-list wrapper is keyed off `upcoming.join(',')`, so a replan (or any
  other queue-content change) remounts just that list and replays the fade — this is the one the
  brief called out as mattering most, since an instant swap there reads as a glitch during the
  cut-short demo beat.

**Layout review at 1280×800 — what was actually checked vs. reasoned about (read this
carefully):** `claude-in-chrome` was offered and the user declined it for this session (matching
`PHASE_3_NOTES.md`'s note that browser automation was unavailable last time this was tried too), so
**no route was visually screenshotted at 1280×800 in this session.** What was actually done instead:
- `npm run build` succeeds and `npm run dev`/`npm run preview` serve the app (`curl` confirmed a
  200 on `/`), so there's no build-time or server-level breakage.
- Every layout claim in the plan (debug panel sized to `bottom-20` so it can't cover
  `NowPlayingBar`/`ConceptBadge`; the corner toggle at `top-4 right-4` clear of both; phase names
  bounded to short fixed phrases in `PHASE_PHRASES` in `src/dj/phases.ts`, so the "long phase name
  breaking layout" risk doesn't actually apply; track titles already using `truncate`) was verified
  by reading the actual component and CSS, not by looking at a rendered page.
- **This is a real gap, not a formality.** CSS box-model reasoning can miss things a screenshot
  wouldn't — font-rendering overflow, actual scroll-region interaction, whether the debug panel's
  `backdrop-blur` renders as expected, exact spacing at the viewport edges. If a real browser check
  becomes available, this is the first thing to run before recording.

## Part C — Demo readiness

**Acceptance walkthrough — what was verified and how.** No browser was available this session
either (same constraint as above), so this was verified two ways, and the two are not
interchangeable — treat the second as real evidence, not a rationalization for skipping the first:
1. Manual code tracing through the actual current source for every step (documented inline above
   and in the component notes).
2. **A temporary script (`walkthrough-check.test.ts` at the repo root, run via `npx vitest run`,
   deleted immediately after — never committed, confirmed via `git status` afterward) drove the
   real `createSession`/`recordEvent`/`getContextCard`/`getDebugSnapshot` functions** through a
   full natural session (seed 1, default) and a friend-seeded session (seed 1,
   `friendPlaylist`/Jordan), the same technique `PHASE_3_NOTES.md` used for the same reason. Actual
   results:
   - Default session, seed 1: 26 tracks played, 3 had no editorial note
     (`track-overnight-freeway-03`, `track-glass-horizon-03`, `track-neon-vows-03`) —
     confirms step 8 (a no-note track really does appear and the fixed chrome path is exercised).
     `editorialCoverageRate: 0.8846`, matching the documented 12–18%-null design. Pool ratio:
     library 0.654 / tasteMatch 0.192 / trending 0.154 — all three within `POOL_TOLERANCE` (0.08)
     of `POOL_TARGET` (0.6/0.25/0.15).
   - Friend-seeded session, seed 1: phase 1 is forced to `anthem` (Jordan's dominant tag,
     `"Big Chorus"`) vs. the default session's phase 1 `euphoric` (`"Peak Hour"`) — confirms the
     phase themes really do read differently for a friend-seeded session. `attribution` was present
     on **every** context card in the session (0 missing out of all planned tracks) — confirms the
     "every context card carries the friend attribution line" claim in step 7, not just "some do."
3. What this does **not** prove: pixel-level rendering, real click timing for the skip-early
   maneuver (step 4), or that the UI actually looks right during any of this — those are still
   reasoned about from the component code, not observed.

Given that, here's the honest per-step status:

| Step | Status |
|---|---|
| 1–2. Open, tap DJ, session starts with phase + sourced card | Code-traced: confirmed |
| 3. 10× speed, phase transition with visible marker | Code-traced: confirmed (toast mechanism unchanged, just made it animate) |
| 4. Two early skips w/ a completed track between → cut short + replan | Code-traced: confirmed (`earlySkipsInPhase` logic unchanged; replan now visibly animates) |
| 5. Save a surfaced track → appears in Library | Code-traced: confirmed |
| 6. Debug panel shows live pool ratio / taste shift / log / metrics | Code-traced: confirmed (this is Phase 5's own new code) |
| 7. Friend-seeded session, different themes, attribution everywhere | **Engine-verified** (see above) — themes differ, attribution on 100% of cards |
| 8. A no-note track appears with the fixed chrome | **Engine-verified** (see above) — 3 such tracks in one natural seed-1 run |

No step required a code change to complete — all pass by this evidence, with the pixel-level
caveat above.

**`README.md`:** replaced the placeholder. Covers what the app is, the Apple disclaimer, run
commands, how to open the debug panel, the five phases, and pointers to `CLAUDE.md`/the phase
notes.

**`DEMO_SCRIPT.md`:** new, repo root. Beat-by-beat recording checklist. One thing worth flagging
that isn't obvious from the brief: **the "Start from…" seed picker only exists on the DJ idle
screen, which only renders when there is no session in memory at all** — not even an ended one
(`SessionSummary` is shown instead). There is no in-app "abandon this session and pick a new seed"
control. So reaching step 7/8's friend-seeded start requires either letting the current session run
to completion, or reloading the tab after it ends (an ended session is intentionally not restored
into `SessionSummary` on reload — `DjView` treats it as no session, per `PHASE_3_NOTES.md`). The
script documents this exact sequence (run to completion at 60×, then reload, then "Start from…").

## Deviations from the brief

- **`SessionSummary`'s restart button doesn't offer re-seeding** — noted above. Not a Phase 5
  regression; this was already true after Phase 4. Out of scope to add a "restart with a seed"
  affordance (new feature), so it's documented in the demo script instead.
- **`UpNextQueue`'s "when a session has ended" empty case doesn't literally occur** in the current
  component tree (see Part B notes above) — fixed the case that does occur (empty queue during an
  active session) rather than one that's structurally unreachable.
- Everything else matches the approved plan.

## Known rough edges

- The one pre-existing test failure in `src/dj/__tests__/seeded-pool.test.ts`
  (`seedSource=song, seed=1`) — confirmed via `git diff --stat src/dj/` to be unrelated to any
  Phase 5 change, and reproduces consistently (not flaky) at the time of this session. Root cause,
  traced through `src/lib/time.ts`'s `timeOfDay()`: the test calls
  `createSession({ ..., now: new Date() })` with the real current time, and the engine's
  time-of-day nudge (`TIME_OF_DAY_BOOST`, ×1.25 on tags matching the real wall-clock hour) is a
  genuine, deliberate PRD feature — so this combo's pool ratio legitimately depends on what hour the
  test happens to run, and currently lands just outside `POOL_TOLERANCE` for this one combo.
  `PHASE_4_NOTES.md` recorded all 30 combos passing when it was written, presumably at a different
  hour. Fixing this means editing the `KNOWN_FAILING` allowlist inside
  `src/dj/__tests__/seeded-pool.test.ts`, which is explicitly off-limits this phase. Flagged to the
  user directly during this session rather than worked around silently.
- The layout-review and acceptance-walkthrough caveats above (code-traced/engine-verified, not
  pixel-verified) are the main honesty caveat for this phase — read them before relying on this
  phase's polish claims for anything high-stakes.
- `TrackRow`'s save button and a few other pre-existing manual-save entry points
  (`SearchView.tsx`, `PlaylistDetailView.tsx`) call `library.addToLibrary` directly and always have
  — that's a Phase 1 feature (manual "add to library while browsing"), unrelated to and pre-dating
  the DJ session's two-call save pattern (`saveCurrent()` in `DjSessionContext.tsx`, which calls
  both `addToLibrary` and `recordEvent`). The debug panel itself — the only new component this
  phase added that touches session data — imports neither `addToLibrary` nor `recordEvent`.
