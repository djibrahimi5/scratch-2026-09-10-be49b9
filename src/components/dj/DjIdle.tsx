import { useState } from 'react'
import { SeedPicker } from '@/components/dj/SeedPicker'

type DjIdleProps = {
  onStart: () => void
}

export function DjIdle({ onStart }: DjIdleProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="w-full max-w-xl rounded-2xl bg-gradient-to-br from-accent/30 via-neutral-900 to-neutral-900 p-10 shadow-xl">
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">AI DJ</div>
        <h1 className="mb-3 text-3xl font-bold text-neutral-50">Start a session</h1>
        <p className="mx-auto mb-8 max-w-md text-sm text-neutral-400">
          A five-phase listening session built from your taste, adapting as you skip and save —
          no setup required.
        </p>
        <button
          onClick={onStart}
          className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-lg transition-transform hover:-translate-y-0.5"
          title="Start session"
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
      {pickerOpen && <SeedPicker onClose={() => setPickerOpen(false)} />}
    </div>
  )
}
