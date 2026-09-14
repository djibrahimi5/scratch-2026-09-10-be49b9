# Demo recording script

Beat-by-beat checklist for recording the acceptance walkthrough. Written as instructions to the
person driving the recording, not as prose about the feature. Record at 1280×800. Tracks run
150–320s of simulated playback; timing notes below assume demo speed is used as instructed —
budget a little slack either side.

## Setup (before you hit record)

1. `npm run build && npm run preview` (or `npm run dev`) so the app is running.
2. Open the app in a fresh tab at **1280×800**. If `localStorage` has state from a previous run
   and you want a clean start, clear site data for the tab first.
3. Confirm the sidebar, now-playing bar, and the small "Concept prototype — not affiliated with
   Apple" badge (bottom-right) are all visible before you start.

## Beat 1 — Open and start (1×, ~5s)

- Click **DJ** in the sidebar (or the "DJ / Start a session" hero card on Home).
- A session starts immediately — no dialog, no setup. You should see the phase banner (phase name
  + "Phase 1 of 5"), the now-playing card, and a sourced context card below it.
- **Hold here a couple of seconds** so the phase name and context card are readable on camera.

## Beat 2 — Sourced context card (1×, ~5s)

- Point out the context card under the now-playing block: either an italicized editorial note
  ("Editor's note") or, if this track has none, the fixed "No editorial note for this track." line
  under the "Why this pick" label. Either is correct — there is never invented commentary.

## Beat 3 — Speed up, watch a phase transition (10×, ~1–2 min real time)

- Click **10×** in the now-playing bar (bottom of the screen).
- Wait for the phase to run out its tracks. When the next phase starts, a short accent-colored
  toast appears under the phase banner for ~2.5s with the transition message, then fades.
- If you want to shorten the wait, click **60×** instead and drop back to **10×** a couple of
  seconds before you expect the transition (phase track counts are visible in the debug panel if
  you want to plan the timing — see Beat 7).

## Beat 4 — Two early skips with a completed track between them (drop to 1×, ~1–2 min)

This is the one beat where speed matters for correctness, not just pacing: an "early" skip means
skipping in the first 20% of a track's duration, so you need enough real time per track to click
in that window comfortably.

1. Switch demo speed to **1×**.
2. As soon as a new track starts (title changes in the now-playing card), click **Skip** right
   away — well inside the first 20%. This is early skip #1; you'll see the context/queue update
   and a "down-weighted…" line lands in the adaptation log (visible later in the debug panel).
3. Let the **next** track play to completion without skipping (fine to bump back to 10× or 60× just
   for this one track if you don't want to wait — you just need it to finish, not skip it).
4. Drop back to **1×**, and as soon as the following track starts, click **Skip** immediately
   again. This is early skip #2.
5. Because it's the second early skip inside the same phase, the phase cuts short: a "cut short"
   toast appears, and the **up-next queue** below visibly re-plans (short fade-in on the list) —
   that fade is the tell that this was a deliberate recompute, not a glitch.

## Beat 5 — Save a DJ-surfaced track (any speed, ~10s)

- Watch the now-playing card's save control (bottom-right of the transport row): it reads
  **"+ Save"** for a track not already in your library, or **"✓ Saved"** if it is.
- While a **"+ Save"** track is playing, click it. It switches to "✓ Saved" immediately.
- Navigate to **Library → Songs** (or **Recently Added**) in the sidebar and confirm the track is
  there. Navigate back to **DJ** — the session is still running exactly where you left it (the
  provider sits above the router, so leaving `/dj` never interrupts playback or the session).

## Beat 6 — No-editorial-note track (passive, watch across beats 1–5)

- Roughly 1 in 6–7 tracks in the catalog has no editorial note by design. Keep an eye on the
  context card as tracks play; when one shows "Why this pick" with no italic note text, call it out
  — that's the guardrailed behavior, not a bug. If none has appeared by Beat 5, it will almost
  always show up within the rest of this session or the next one.

## Beat 7 — Open the debug panel (any speed, ~20–30s)

- Press **Ctrl+K** (Windows/Linux) or **Cmd+K** (macOS), or click the **Debug** pill in the top-right
  corner.
- Narrate through, top to bottom: seed + RNG cursor, the base-vs-live taste vector bars (visibly
  shifted from the skip/save actions in Beats 4–5), the phase plan with pool breakdowns, the
  session-level pool ratio vs. target ±tolerance (each bucket marked in/out of tolerance), any
  substitutions, the guardrail metrics (save rate, skip-rate gap, editorial coverage — call out that
  this last one is the catalog-readiness number), and the scrollable event log at the bottom.
- Press **Escape**, or click the Debug pill again, to close it. Confirm playback never paused while
  it was open.

## Beat 8 — Seeded from Jordan's playlist (60×, then a reload)

The "Start from…" seed picker only appears on the DJ idle screen, which only shows when there is
**no** active or just-ended session in memory — so this beat needs the current session to actually
end first.

1. Switch to **60×** and let the current session run to completion (roughly 1–2 minutes of real
   time for a full ~25-track session at this speed). It ends on its own — no click needed — and you
   land on the session summary screen.
2. **Reload the browser tab.** (An ended session is intentionally not restored on reload — you land
   back on the DJ idle screen instead of the summary.) You should see "Start another session" copy,
   since a prior session now exists in storage.
3. Click **Start from…**, then choose **"Start from Jordan's playlist — Jordan's Morning Mix"** in
   the highlighted section at the bottom of the picker.
4. The new session starts immediately. Confirm: the phase themes read differently than the earlier
   session (they're drawn from Jordan's playlist's tag profile), and every context card now shows a
   friend-attribution line under the reason text.

## Wrap

- Total run time if you don't pad the pauses: roughly 5–7 minutes, most of it Beats 3, 4, and 8.
- If re-recording, reloading the tab (or clearing site data) resets to a clean first-run state,
  including the "Start a session" (not "Start another session") copy on the idle screen.
