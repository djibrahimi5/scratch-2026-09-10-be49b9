# Muse

Muse is a concept prototype of a mock music-streaming web app, built to make one feature — an
autonomous DJ that builds and adapts a listening session from a user's own taste — interactive and
demoable. It is **not affiliated with Apple**: no Apple marks, no real artists, songs, or album
art. The entire catalog is invented, and album art is generated procedurally
(`src/lib/proceduralArt.ts`). Playback is simulated by a timer, not real audio.

This is a product-management portfolio piece. It implements a real PRD end to end — the app shell
exists to give the DJ feature a place to live and be clicked through, not the other way around. See
`CLAUDE.md` for the full product rules and build history.

## Running it

```
npm install
npm run dev          # dev server
npm run build         # type-check + production build
npm run test           # engine + integration tests (vitest)
npm run dj:demo        # headless walkthrough of one DJ session, printed to the console
```

## The DJ feature

Click **DJ** in the sidebar. A session starts with no input required: five phases, each built
around a taste-weighted theme, adapting in real time as you skip or save tracks. Context cards
under each track are sourced from the catalog's own editorial notes — never generated — and show a
fixed "no editorial note" state when a track has none, by design (about 12–18% of the catalog).

Use the **demo speed** control in the now-playing bar (1× / 10× / 60×) to move through a session
quickly. "Start from…" on the idle screen lets you seed a session from a song, an artist, your
library, a playlist, or a friend's playlist instead of the zero-input default.

## The debug panel

Press **Ctrl+K** (or **Cmd+K** on macOS), or click the **Debug** button in the top-right corner of
any screen. It's a read-only, always-available view into the DJ engine's internals for the current
session: the seed and RNG cursor, how the taste vector has shifted from skips/completes, the
five-phase plan and each phase's pool breakdown, the realized library/taste-match/trending ratio
against its target and tolerance, any pool substitutions the allocator had to make, the PRD's
guardrail metrics (save rate, skip-rate gap, editorial coverage), and the full adaptation event
log. It works in the production build, not just `npm run dev`, and never mutates the session — it
only calls `getDebugSnapshot()`.

## What shipped, by phase

1. **Shell** — routing, sidebar, Home/Library/Search/New/Radio, now-playing bar, the invented
   catalog, procedural album art, simulated playback with demo speed.
2. **DJ engine** (`src/dj/`) — a pure, deterministic TypeScript engine: taste modeling, phase
   planning, pool allocation, session events, metrics. No React, no DOM, no `Math.random()`.
3. **DJ view (P0)** — the zero-input session experience: phase transitions, cut-short/replan on
   early skips, sourced context cards, skip/save wired to playback and the library, full
   reload-mid-session resume.
4. **P1/P2 seeding** — starting a session from a song, artist, your library, a playlist, or a
   friend's playlist, with attribution surfaced on context cards.
5. **Debug panel + polish** — the read-only engine-internals panel described above, plus
   transitions, empty states, keyboard/focus handling, and a copy/layout pass.

Each phase has a `PHASE_N_NOTES.md` at the repo root with the detail a fresh session would need to
continue the work — architecture decisions, deviations from the original brief, and what was
actually verified versus reasoned about.
