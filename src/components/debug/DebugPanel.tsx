import { useEffect, useRef, useState, type ReactNode } from 'react'
import { getDebugSnapshot, type PoolSourceLabel } from '@/dj'
import { POOL_TARGET, POOL_TOLERANCE } from '@/dj/constants'
import { resolveSeedLabel, useDjSession } from '@/state/DjSessionContext'
import { formatDuration, formatPercent, formatSignedPercentagePoints } from '@/lib/format'
import { TasteVectorChart } from './TasteVectorChart'

const POOL_LABELS: Record<PoolSourceLabel, string> = {
  library: 'Library',
  tasteMatch: 'Taste match',
  trending: 'Trending',
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">{children}</div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-white/5 px-5 py-5">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  )
}

// This panel is read-only for engine internals: it only ever calls getDebugSnapshot to render,
// and never calls recordEvent directly (that stays callable only from DjSessionContext). Its one
// exception is "Reset demo" below — an explicit, confirmed escape hatch that hands the app back to
// DjSessionContext.resetDemo to clear all local state, for resetting between walkthroughs rather
// than as a product feature.
export function DebugPanel() {
  const dj = useDjSession()
  const [isOpen, setIsOpen] = useState(false)
  const triggerFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        return
      }
      if (e.key === 'Escape') {
        setIsOpen((prev) => (prev ? false : prev))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      triggerFocusRef.current = document.activeElement as HTMLElement | null
    } else {
      triggerFocusRef.current?.focus?.()
    }
  }, [isOpen])

  const snapshot = dj.session ? getDebugSnapshot(dj.session) : null

  function handleResetDemo() {
    const confirmed = window.confirm(
      'Reset the demo? This ends any active session and clears your saved library additions and demo speed — back to a first-visit state. This cannot be undone.',
    )
    if (confirmed) {
      dj.resetDemo()
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close debug panel' : 'Open debug panel'}
        aria-expanded={isOpen}
        title="Debug panel (Ctrl+K / Cmd+K)"
        className="fixed right-4 top-4 z-50 flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-neutral-900/90 px-3 text-xs font-semibold text-neutral-300 shadow-lg backdrop-blur hover:text-neutral-100"
      >
        <span aria-hidden="true">⌥</span> Debug
      </button>

      <div
        role="dialog"
        aria-label="DJ engine debug panel"
        aria-hidden={!isOpen}
        className={`fixed bottom-20 right-0 top-0 z-40 flex w-full max-w-md flex-col border-l border-white/5 bg-neutral-950/97 shadow-2xl backdrop-blur transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <div className="text-sm font-bold text-neutral-50">Debug panel</div>
            <div className="text-[11px] text-neutral-500">
              Read-only view into the DJ engine — nothing here writes back to the session.
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close debug panel"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Section title="Demo controls">
            <p className="mb-3 text-xs text-neutral-500">
              Clears saved library additions, ends any active session, and resets demo speed —
              back to a first-visit state. A demo reset tool, not a product feature.
            </p>
            <button
              onClick={handleResetDemo}
              className="rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent/10"
            >
              Reset demo
            </button>
          </Section>
          {!snapshot ? (
            <div className="p-5 text-sm text-neutral-500">
              No active DJ session — start one from the DJ tab to see live engine internals.
            </div>
          ) : (
            <>
              <Section title="Session identity">
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-neutral-500">Seed</dt>
                  <dd className="tabular-nums text-neutral-200">{snapshot.seed}</dd>
                  <dt className="text-neutral-500">RNG cursor</dt>
                  <dd className="tabular-nums text-neutral-200">{snapshot.rngCursor}</dd>
                  <dt className="text-neutral-500">Seeded from</dt>
                  <dd className="text-neutral-200">
                    {resolveSeedLabel(snapshot.seedSource) ?? 'Your taste (default)'}
                  </dd>
                </dl>
                <p className="mt-2 text-[11px] text-neutral-600">
                  Seeds are drawn from a fixed, rotating list ({'{1,2,3,4,5}'}), not a random source
                  — this is what keeps the demo reproducible on stage.
                </p>
              </Section>

              <Section title="Taste vector">
                <TasteVectorChart base={snapshot.baseTasteVector} live={snapshot.tasteVector} />
              </Section>

              <Section title="Phase plan">
                <div className="flex flex-col gap-2">
                  {snapshot.phases.map((phase) => {
                    const endedActive = phase.status === 'active' && dj.session?.status === 'ended'
                    const statusLabel = endedActive ? 'completed*' : phase.status
                    return (
                      <div key={phase.index} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-neutral-100">
                            {phase.index + 1}. {phase.name}
                          </span>
                          <span className="shrink-0 text-[11px] font-semibold uppercase text-neutral-400">
                            {statusLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Dominant tag: <span className="text-neutral-300">{phase.dominantTag}</span>
                        </div>
                        <div className="mt-1 flex gap-3 text-[11px] text-neutral-500">
                          <span>Library {phase.poolBreakdown.library}</span>
                          <span>Taste match {phase.poolBreakdown.tasteMatch}</span>
                          <span>Trending {phase.poolBreakdown.trending}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-2 text-[11px] text-neutral-600">
                  * The engine only marks a phase "completed" when the next phase's first track
                  starts. The last phase of a session that finishes naturally never gets that
                  trigger, so it's shown here as completed-by-inference once the session has ended
                  — this is documented engine behavior, not a bug.
                </p>
              </Section>

              <Section title="Session pool ratio">
                <div className="flex flex-col gap-2">
                  {(Object.keys(POOL_TARGET) as PoolSourceLabel[]).map((bucket) => {
                    const realized = snapshot.sessionPoolRatio[bucket]
                    const target = POOL_TARGET[bucket]
                    const inTolerance = Math.abs(realized - target) <= POOL_TOLERANCE
                    return (
                      <div key={bucket} className="flex items-center justify-between text-xs">
                        <span className="text-neutral-300">{POOL_LABELS[bucket]}</span>
                        <span className="tabular-nums text-neutral-400">
                          {formatPercent(realized)} target {formatPercent(target)} ±
                          {formatPercent(POOL_TOLERANCE)}
                        </span>
                        <span
                          className={`ml-2 text-[11px] font-semibold ${
                            inTolerance ? 'text-emerald-400' : 'text-accent'
                          }`}
                        >
                          {inTolerance ? 'in tolerance' : 'out of tolerance'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Section>

              <Section title="Substitutions">
                {snapshot.substitutions.length === 0 ? (
                  <p className="text-xs text-neutral-500">No substitutions were needed this session.</p>
                ) : (
                  <ul className="flex flex-col gap-1 text-xs text-neutral-400">
                    {snapshot.substitutions.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Metrics">
                <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 text-xs">
                  <dt className="text-neutral-400">
                    Save rate on surfaced
                    <div className="text-[10px] text-neutral-600">Guardrail: ≥10%</div>
                  </dt>
                  <dd className="text-right tabular-nums text-neutral-100">
                    {formatPercent(snapshot.metrics.saveRateOnSurfaced)}
                  </dd>

                  <dt className="text-neutral-400">
                    Library skip rate
                    <div className="text-[10px] text-neutral-600">vs. your baseline skip rate</div>
                  </dt>
                  <dd className="text-right tabular-nums text-neutral-100">
                    {formatPercent(snapshot.metrics.librarySkipRate)}
                  </dd>

                  <dt className="text-neutral-400">
                    Skip-rate gap
                    <div className="text-[10px] text-neutral-600">Guardrail: within ±10pp</div>
                  </dt>
                  <dd className="text-right tabular-nums text-neutral-100">
                    {formatSignedPercentagePoints(snapshot.metrics.skipRateGapPp)}
                  </dd>

                  <dt className="text-neutral-400">
                    Editorial coverage
                    <div className="text-[10px] text-neutral-600">
                      Share of played tracks with a sourced editorial note — the direct read on
                      whether the catalog supports this feature at all
                    </div>
                  </dt>
                  <dd className="text-right tabular-nums text-neutral-100">
                    {formatPercent(snapshot.metrics.editorialCoverageRate)}
                  </dd>

                  <dt className="text-neutral-400">Session length</dt>
                  <dd className="text-right tabular-nums text-neutral-100">
                    {formatDuration(snapshot.metrics.sessionLengthSec)}
                  </dd>
                </dl>
              </Section>

              <Section title="Event log">
                <div className="max-h-64 overflow-y-auto rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <ol className="flex flex-col gap-1.5 text-[11px] text-neutral-400">
                    {snapshot.eventLog.map((event, i) => (
                      <li key={i}>
                        <span className="text-neutral-600">{event.type}</span> — {event.message}
                      </li>
                    ))}
                  </ol>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </>
  )
}
