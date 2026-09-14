import { TrackRow } from '@/components/track/TrackRow'
import { useLibrary } from '@/state/LibraryContext'
import { usePlayer } from '@/state/PlayerContext'

export function RecentlyAddedView() {
  const library = useLibrary()
  const player = usePlayer()
  const recent = [...library.libraryIds].reverse()

  if (recent.length === 0) {
    return <p className="text-sm text-neutral-500">Your library is empty.</p>
  }

  return (
    <div className="max-w-2xl">
      {recent.map((trackId) => (
        <TrackRow
          key={trackId}
          trackId={trackId}
          isPlaying={player.currentTrackId === trackId}
          isSaved
          onPlay={() => player.play(trackId)}
        />
      ))}
    </div>
  )
}
