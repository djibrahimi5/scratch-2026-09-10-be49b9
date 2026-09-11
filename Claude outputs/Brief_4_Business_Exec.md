# Business Brief — DJ (Apple Music)

**To:** Apple Music Executive Sponsor
**From:** Dylan Ibrahimi, Product
**Date:** September 10, 2026
**Re:** Approval for a six-week randomized beta

---

## The decision requested

Approve a **six-week randomized beta in one English-language market**, with a genuine no-access control group. Nothing beyond that is being asked for today. Expansion is gated on three pre-committed numeric triggers, so the follow-on decision is close to mechanical.

## The gap

Apple Music personalizes through algorithmic playlists and a prompt-based AI Playlist generator. Nothing autonomously builds and narrates an evolving listening session without the user first describing what they want. Spotify has shipped exactly that since 2023 and expanded it steadily. Subscribers who specifically want that experience currently have to leave to get it, and the gap feeds a broader perception that our discovery is weaker than theirs.

## Why the downside is capped

This is deliberately not a moonshot:

- **It's an experience layer, not a new model.** We are not changing recommendation ranking. Existing personalization signals feed it.
- **The transition technology exists.** AutoMix already handles blending between tracks.
- **The content largely exists.** The differentiating context comes from editorial material Apple has already produced, rather than a new content operation.
- **No synthetic voice, no TTS, no new persona** — which removes the largest cost and the largest brand risk in the category.

The main cost uncertainty is **editorial coverage** — how much of the catalog has usable context attached, and what closing the gaps would cost. Engineering is answering that first, because it changes scope.

## Why our version is defensible

Spotify's DJ is a synthetic host with a generated voice. Ours has no host: every piece of context is sourced from what our editors actually wrote, and where nothing real exists, the DJ says nothing.

That is not a hedge, it's the strategy. Apple Music's differentiator has been human curation since launch, and a synthetic personality would have been off-brand here regardless of how it performed — which is plausibly why we haven't already shipped something in this space. The version proposed here respects that constraint instead of fighting it, and lands on ground Spotify cannot easily copy.

## How we'll know it worked

Three gates, checked at week 6, all of which must hold to expand:

| Gate | Threshold |
|---|---|
| Feature stickiness (feature-DAU ÷ feature-MAU) | ≥ 20% |
| Save rate on DJ-surfaced songs new to the user | ≥ 10% |
| Skip-rate gap on library songs vs. the user's own baseline | ≤ 10 points |

Reported alongside, without gating: trial rate (so stickiness is interpretable), total listening time vs. control (so we can tell net-new engagement from cannibalized Personal Mix listening), and results split by discovery under-engagers, the segment this is strategically aimed at.

Rollback is deliberately asymmetric to advance: a breach in **two consecutive weeks**, or a single severe breach. A rule that fires on one noisy week in a six-week window with three metrics will fire on ordinary variance.

## On the churn case — the honest version

The strategic goal is reducing churn to Spotify, and I want to be straight about what this beta can and cannot prove.

Baseline monthly churn in music streaming is very low — Spotify runs under 1.5%, and audio streaming churns around 12% annually against video's ~40%. Over 90 days that's roughly a 4.4% baseline. A 10% relative reduction among users who actually adopt the feature is a **0.44 percentage-point** difference. But the clean intent-to-treat comparison dilutes that effect by the adoption rate, and the sample size required scales with the square of that dilution:

| Trial rate | ITT effect | Users needed per arm |
|---|---|---|
| 100% | 0.44 pp | ~32,000 |
| 50% | 0.22 pp | ~132,000 |
| 25% | 0.11 pp | ~535,000 |
| 10% | 0.044 pp | ~3.4 million |

**So the beta cannot be sized before we observe trial rate.** The commitment is: measure trial rate at week 2, size the cohort from this table, and expand the cohort — not the timeline — if adoption lands low. If the required sample proves unreachable, the Day-90 churn read gets reported as **directional** and the claim gets deferred, rather than dressed up as proof.

What this beta genuinely decides is a **product-quality** question — do people come back, do they discover music they keep, does the DJ sequence known music well. Those three gates are real and readable at this scale. The churn thesis is the reason to run the experiment; it is not something six weeks and one market can settle, and I'd rather say that now than defend a number later.

## Principal risks

1. **Editorial coverage falls short.** The differentiator thins and the feature drifts toward a well-sequenced playlist. Mitigation: answered before spec, and it changes scope rather than surfacing late.
2. **Cannibalization.** DJ listening displaces Personal Mix rather than adding to it, and total engagement stays flat. Mitigation: the holdout we already need for churn measures this at no extra cost.
3. **Perception.** We get read as copying Spotify. Mitigation: marketing is positioning on sourced editorial and, on my recommendation, not leading with "AI."

## The ask

Approve Phase 1. Six weeks, one market, randomized holdout preserved through any expansion. Three numeric gates, pre-committed, with the churn read reported honestly against its statistical limits.
