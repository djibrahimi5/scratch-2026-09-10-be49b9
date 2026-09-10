import { useParams } from 'react-router-dom'
import { TrackRow } from '@/components/track/TrackRow'
import { PLAYLISTS } from '@/data'
import { usePlayer } from '@/state/PlayerContext'
import { useLibrary } from '@/state/LibraryContext'

export function PlaylistDetailView() {
  const { playlistId } = useParams<{ playlistId: string }>()
  const player = usePlayer()
  const library = useLibrary()
  const playlist = PLAYLISTS.find((p) => p.id === playlistId)

  if (!playlist) {
    return <div className="text-neutral-500">Playlist not found.</div>
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-50">{playlist.title}</h1>
      <p className="mb-8 text-sm text-neutral-500">{playlist.description}</p>
      <div className="max-w-2xl">
        {playlist.trackIds.map((trackId, index) => (
          <TrackRow
            key={trackId}
            trackId={trackId}
            index={index}
            isPlaying={player.currentTrackId === trackId}
            isSaved={library.isInLibrary(trackId)}
            onPlay={() => player.play(trackId)}
            onSave={() => library.addToLibrary(trackId)}
          />
        ))}
      </div>
    </div>
  )
}
