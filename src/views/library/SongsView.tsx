import { TrackRow } from '@/components/track/TrackRow'
import { useLibrary } from '@/state/LibraryContext'
import { usePlayer } from '@/state/PlayerContext'

export function SongsView() {
  const library = useLibrary()
  const player = usePlayer()

  return (
    <div className="max-w-2xl">
      {library.libraryIds.map((trackId, index) => (
        <TrackRow
          key={trackId}
          trackId={trackId}
          index={index}
          isPlaying={player.currentTrackId === trackId}
          isSaved
          onPlay={() => player.play(trackId)}
        />
      ))}
    </div>
  )
}
