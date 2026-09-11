# Design Brief — DJ (Apple Music)

**To:** Apple Music Design
**From:** Dylan Ibrahimi, Product
**Date:** September 10, 2026
**Re:** Screen states and the central design problem for DJ

---

## The design problem, in one sentence

**How do we show the listener why a song was chosen, without a host?**

Spotify's DJ solves this with a synthetic voice and a personality. We are deliberately not doing that. Our context is written, factual, and drawn from material Apple's editors already produced — so the entire "narration" of this feature has to happen visually, in a product people mostly listen to without looking at.

That constraint is the brief.

## What the DJ is

The user taps DJ. A session starts immediately — no prompt, no setup. It runs in themed phases of several songs each (mood, era, scene) that shift as the session goes, adapting to skips. Each pick can carry a short piece of sourced context: an editor's note, a fact about the recording, release context. Later, users can seed a session from a song, artist, playlist, their library, or a friend's playlist.

## Screen states we need

1. **Entry point.** DJ in the sidebar and as a hero on Home. It should read as a place you go, not a shuffle button you press.
2. **Session start.** The first pick, its phase, and its context. This is the moment the feature either explains itself or doesn't.
3. **Now playing, with context.** The context card alongside artwork and controls. Open question below.
4. **Phase transition.** A visible marker when the session moves to a new theme. The session's evolution is a core promise of the feature; if it's invisible, the feature reads as a playlist.
5. **No context available.** See below — the hardest state, and the one most likely to be skipped.
6. **Seeded session entry (P1/P2).** "Start from…" — a song, artist, playlist, library, or a friend. The DJ still drives; the seed only sets the direction. That distinction needs to be legible or users will expect a playlist and feel misled.
7. **Friend-seeded attribution.** Whose taste this session is drawing on, visible without feeling like a social feature.
8. **Cold start.** A new user with almost no history still needs a session that feels chosen, not random.

## The hard state: no context available

Roughly one in seven picks will have **no sourced editorial material**, and on those the DJ shows the scoring-derived reason line and nothing else. We will never generate substitute copy to fill the space — that would quietly turn this into the synthetic-narration product we said we weren't building.

So the design has to make that absence read as **intentional restraint rather than a loading failure or a bug**. A card that's simply blank, or a layout that visibly collapses, tells the user something broke. This is the single most important thing to get right in this brief, because it's where the product's integrity is visible in the interface.

## Constraints

- No synthetic host persona, no voice, no first-person DJ character. Context is factual and attributed.
- Native to Apple Music, not a bolted-on mode. It should look like something that was always going to be here.
- Context must never obscure artwork or playback controls.
- **This is an audio-first product.** Most of a session is heard, not watched. Whatever we design must degrade gracefully to a screen nobody is looking at — which raises the question of whether context is ambient and persistent, or a moment you can miss.

## Open question for design to answer

**How prominent is the context, and how long does it live?** A persistent panel makes the feature's differentiator always visible but risks feeling like homework during a listening session. A transient card that appears at the start of each track is lighter but easily missed on a locked screen. There's a real tradeoff here and product doesn't have a settled view — we'd rather see two directions than receive one.

## What we need back

Screen states for the eight above, and an explicit point of view on the no-context case and the prominence question. Directions, not final comps.
