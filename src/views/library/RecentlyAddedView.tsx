import { TrackRow } from '@/components/track/TrackRow'
import { useLibrary } from '@/state/LibraryContext'
import { usePlayer } from '@/state/PlayerContext'

export function RecentlyAddedView() {
  const library = useLibrary()
  const player = usePlayer()
  const recent = [...library.libraryIds].reverse()

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
