import { useState } from 'react'
import { SeedPicker } from '@/components/dj/SeedPicker'
import { loadLastSession } from '@/lib/storage'
import { resolveSeedLabel } from '@/state/DjSessionContext'

type DjIdleProps = {
  onStart: () => void
}

export function DjIdle({ onStart }: DjIdleProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  // Read once at mount: a returning user (a prior session exists in storage) gets slightly
  // different copy rather than always looking like a first-ever visit.
  const [lastSession] = useState(() => loadLastSession())
  const lastSeedLabel = lastSession ? resolveSeedLabel(lastSession.seedSource) : null

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="w-full max-w-xl rounded-2xl bg-gradient-to-br from-accent/30 via-neutral-900 to-neutral-900 p-10 shadow-xl">
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">DJ</div>
        <h1 className="mb-3 text-3xl font-bold text-neutral-50">
          {lastSession ? 'Start another session' : 'Start a session'}
        </h1>
        <p className="mx-auto mb-8 max-w-md text-sm text-neutral-400">
          {lastSession
            ? `A new five-phase session, adapting as you skip and save — no setup required.${
                lastSeedLabel ? ` Your last one was seeded from ${lastSeedLabel}.` : ''
              }`
            : 'A five-phase listening session built from your taste, adapting as you skip and save — no setup required.'}
        </p>
        <button
          onClick={onStart}
          aria-label="Start session"
          title="Start session"
          className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-lg transition-transform hover:-translate-y-0.5"
        >
          ▶
        </button>
        <div>
          <button
            onClick={() => setPickerOpen(true)}
            className="mt-4 text-sm font-medium text-neutral-400 underline decoration-white/20 underline-offset-4 hover:text-neutral-100"
          >
            Start from…
          </button>
        </div>
      </div>
      <SeedPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  )
}
