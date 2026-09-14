import { ContextCard } from '@/components/dj/ContextCard'
import { DjIdle } from '@/components/dj/DjIdle'
import { DjNowPlaying } from '@/components/dj/DjNowPlaying'
import { PhaseBanner } from '@/components/dj/PhaseBanner'
import { SessionSummary } from '@/components/dj/SessionSummary'
import { UpNextQueue } from '@/components/dj/UpNextQueue'
import { useDjSession } from '@/state/DjSessionContext'

export function DjView() {
  const dj = useDjSession()

  if (!dj.session) {
    return <DjIdle onStart={dj.startSession} />
  }

  if (dj.session.status === 'ended') {
    return <SessionSummary state={dj.session} onRestart={dj.startSession} />
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto pb-4">
      {dj.currentPhase && (
        <PhaseBanner phase={dj.currentPhase} transitionEvent={dj.lastTransitionEvent} />
      )}
      {dj.currentTrackId && (
        <DjNowPlaying
          trackId={dj.currentTrackId}
          isSaved={dj.isSaved(dj.currentTrackId)}
          onSave={dj.saveCurrent}
        />
      )}
      {dj.currentCard && <ContextCard key={dj.currentTrackId} card={dj.currentCard} />}
      <UpNextQueue
        upcoming={dj.upcoming}
        phases={dj.session.phases}
        currentPhaseIndex={dj.session.currentPhaseIndex}
      />
    </div>
  )
}
