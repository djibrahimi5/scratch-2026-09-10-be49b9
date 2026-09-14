import { useEffect, useState } from 'react'
import type { Phase, SessionEvent } from '@/dj'

type PhaseBannerProps = {
  phase: Phase
  transitionEvent: { event: SessionEvent; seq: number } | null
}

const TOAST_DURATION_MS = 2500

export function PhaseBanner({ phase, transitionEvent }: PhaseBannerProps) {
  const [visible, setVisible] = useState(false)
  // Held separately from `visible` so the toast keeps showing its last message while it fades
  // out, instead of the text disappearing a beat before the fade finishes.
  const [message, setMessage] = useState('')

  // Keyed on transitionEvent?.seq (not object identity or an unrelated parent re-render), so
  // this fires exactly once per genuinely new phaseTransition/phaseCutShort — a replacement,
  // never a queue, if a new one arrives before the previous toast has dismissed.
  useEffect(() => {
    if (!transitionEvent) return
    setMessage(transitionEvent.event.message)
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionEvent?.seq])

  return (
    <div className="relative">
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-neutral-900 px-5 py-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">
            Phase {phase.index + 1} of 5
          </div>
          <div className="text-lg font-semibold text-neutral-50">{phase.name}</div>
        </div>
        <div className="text-xs text-neutral-500">{phase.era}</div>
      </div>

      {/* Always rendered (not conditionally mounted) so both the entrance and the exit actually
          transition instead of popping in/out abruptly. */}
      <div
        aria-hidden={!visible}
        className={`absolute left-1/2 top-full z-10 mt-2 w-max max-w-sm -translate-x-1/2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
      >
        {message}
      </div>
    </div>
  )
}
