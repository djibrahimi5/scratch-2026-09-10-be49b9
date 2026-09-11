import { computeMetrics, type SessionState } from '@/dj'
import { TrackRow } from '@/components/track/TrackRow'
import { formatDuration, formatPercent, formatSignedPercentagePoints } from '@/lib/format'
import { resolveSeedLabel } from '@/state/DjSessionContext'

type SessionSummaryProps = {
  state: SessionState
  onRestart: () => void
}

export function SessionSummary({ state, onRestart }: SessionSummaryProps) {
  const metrics = computeMetrics(state)
  const seedLabel = resolveSeedLabel(state.seedSource)
  // The engine only flips a phase to 'completed' when the *next* phase's trackStart fires, so the
  // final phase of a naturally-finished session is never marked 'completed' — there's no phase
  // after it to trigger the transition. Since state.status === 'ended' only happens once every
  // planned track has been played, a still-'active' phase at that point is done in every sense
  // that matters here.
  const completed = state.phases.filter(
    (p) => p.status === 'completed' || (p.status === 'active' && state.status === 'ended'),
  ).length
  const cutShort = state.phases.filter((p) => p.status === 'cutShort').length

  const stats: { label: string; value: string }[] = [
    { label: 'Tracks played', value: String(state.playedTrackIds.length) },
    { label: 'Save rate on surfaced', value: formatPercent(metrics.saveRateOnSurfaced) },
    { label: 'Library skip rate', value: formatPercent(metrics.librarySkipRate) },
    { label: 'Skip-rate gap', value: formatSignedPercentagePoints(metrics.skipRateGapPp) },
    { label: 'Session length', value: formatDuration(metrics.sessionLengthSec) },
    { label: 'Editorial coverage', value: formatPercent(metrics.editorialCoverageRate) },
  ]

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col justify-center gap-6">
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
          Session complete
        </div>
        <h1 className="text-3xl font-bold text-neutral-50">
          {completed} phase{completed === 1 ? '' : 's'} completed
          {cutShort > 0 && `, ${cutShort} cut short`}
        </h1>
        {seedLabel && <p className="mt-1 text-sm text-neutral-500">Seeded from {seedLabel}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/5 bg-neutral-900 p-4">
            <div className="text-xl font-bold text-neutral-50">{stat.value}</div>
            <div className="text-xs text-neutral-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {state.savedThisSession.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
            Saved this session
          </div>
          <div className="flex flex-col rounded-xl border border-white/5 bg-neutral-900 p-2">
            {state.savedThisSession.map((trackId) => (
              <TrackRow key={trackId} trackId={trackId} />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className="self-start rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        Start another session
      </button>
    </div>
  )
}
