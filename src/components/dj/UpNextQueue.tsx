import { useMemo } from 'react'
import { TrackRow } from '@/components/track/TrackRow'
import { useDjSession } from '@/state/DjSessionContext'
import type { Phase } from '@/dj'

type UpNextQueueProps = {
  upcoming: string[]
  phases: Phase[]
  currentPhaseIndex: number
}

type Group = { phase: Phase; trackIds: string[] }

const STATUS_LABEL: Record<Phase['status'], string> = {
  pending: 'Up next',
  active: 'Now playing',
  completed: 'Completed',
  cutShort: 'Cut short',
}

export function UpNextQueue({ upcoming, phases }: UpNextQueueProps) {
  const dj = useDjSession()

  const phaseByTrackId = useMemo(() => {
    const map = new Map<string, number>()
    phases.forEach((phase, index) => {
      for (const id of phase.plannedTrackIds) map.set(id, index)
    })
    return map
  }, [phases])

  const groups = useMemo(() => {
    const result: Group[] = []
    for (const trackId of upcoming) {
      const phaseIndex = phaseByTrackId.get(trackId)
      const phase = phaseIndex !== undefined ? phases[phaseIndex] : undefined
      if (!phase) continue
      const last = result[result.length - 1]
      if (last && last.phase.index === phase.index) {
        last.trackIds.push(trackId)
      } else {
        result.push({ phase, trackIds: [trackId] })
      }
    }
    return result
  }, [upcoming, phaseByTrackId, phases])

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-900 p-5">
      <div className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
        Up next
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nothing left in the queue — this is the last track of the session.
        </p>
      ) : (
        // Keyed off the actual track-id sequence so a replan (or any other queue change) remounts
        // this list and replays the fade-in — the goal is for a replan to read as a deliberate
        // decision rather than an instant, glitch-looking swap.
        <div key={upcoming.join(',')} className="dj-fade-in flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.phase.index}>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-200">{group.phase.name}</div>
                <div
                  className={`text-xs font-medium ${
                    group.phase.status === 'active' ? 'text-accent' : 'text-neutral-500'
                  }`}
                >
                  {STATUS_LABEL[group.phase.status]}
                </div>
              </div>
              <div className="flex flex-col">
                {group.trackIds.map((trackId) => (
                  <TrackRow key={trackId} trackId={trackId} isSaved={dj.isSaved(trackId)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
