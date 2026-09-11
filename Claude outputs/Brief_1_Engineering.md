# Engineering Brief — DJ (Apple Music)

**To:** Apple Music Personalization & Playback Engineering
**From:** Dylan Ibrahimi, Product
**Date:** September 10, 2026
**Re:** Feasibility input for DJ, ahead of technical spec

---

## The ask

An autonomous listening session: the user taps DJ and gets an evolving, themed queue built from their own listening history, with a short piece of **sourced** context attached to each pick. No prompt, no input. We need feasibility and rough sizing on four questions before this goes to spec — not a full design.

## What we are explicitly not asking for

- Not rebuilding AutoMix. The DJ consumes it for transitions.
- Not changing the recommendation ranking model. This is an experience layer over existing personalization signals.
- No text-to-speech, no synthetic voice, no generated prose of any kind.
- No offline support in V1.

## Question 1 — Editorial coverage (highest risk, answer this first)

The feature's entire differentiator is that its commentary is **sourced from material we already own** — editor notes, artist and album facts, release context, existing Apple Music 1 segments — and never generated. Where no sourced material exists for a track, the DJ says nothing about it.

We need to know:

- What fraction of tracks in a typical user's session have usable editorial or factual content attached today?
- Where does that content live, is it queryable at serve time, and at what latency?
- Is coverage uniform, or concentrated in new releases and catalog we've featured?

**If coverage is thin, the differentiator is thin, and we need to know that now rather than after a design cycle.** A version where 70% of picks play in silence is a different product than the one in the PRD. This answer changes scope, so it comes before everything else here.

## Question 2 — Session construction

The PRD describes each session as several theme phases, each drawing roughly 60% from the user's library and history, 25% taste-matched material outside the library, and 15% trending. Phases shift every few songs; skips re-weight the remainder of the session in real time.

- Is this a serve-time service or a precomputed session refreshed periodically? What's the cost per session either way?
- Recency weighting: the PRD assumes short windows (last 7 days weighted above last 30, above lifetime). Is that shape supportable from existing signals?
- Real-time adaptation on skip — how much of the queue can we re-plan mid-session without a user-visible stall?

## Question 3 — Two unresolved edge cases

Both are currently product assumptions, not verified behavior, and both need real handling:

- **Cold start.** Sparse history falls back to a popularity-weighted, editorially-anchored mix. What's the signal threshold where personalization becomes meaningful?
- **Eclectic taste.** Noisy signal across dissimilar genres weights recent windows over lifetime history, and lets theme phases carry the switching rather than interleaving genres inside a phase. Does that hold up against real listening distributions?

## Question 4 — Instrumentation

The Phase 1 beta cannot read out without these, and retrofitting event schemas after launch is how a beta gets wasted:

- Skip events must record **position within the track** and **position within the theme phase**. V1 does not use the theme-transition distinction, but V2's sharper skip guardrail is impossible without it, so the schema needs to support it from day one.
- Save events must distinguish tracks **already in the user's library** from **new to the user** — the two guardrails measure different populations.
- Total listening time per user must be attributable across surfaces, so we can tell whether DJ listening is **net new** or displacing Personal Mix and Favorites Mix.
- Cohort assignment must support **stratification** on a listening-behavior segment (users below a threshold share of non-user-initiated listening), not just random assignment.

## What we need back

1. A yes/no plus a number on editorial coverage.
2. Rough sizing for session construction, with the serve-time vs. precomputed tradeoff called out.
3. Any blocking unknown we haven't listed.

Target: enough to decide scope before spec. Rough is fine; confident is better than precise.
