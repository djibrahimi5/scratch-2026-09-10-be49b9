import { useNavigate, useParams } from 'react-router-dom'
import { TrackRow } from '@/components/track/TrackRow'
import { PLAYLISTS } from '@/data'
import { usePlayer } from '@/state/PlayerContext'
import { useLibrary } from '@/state/LibraryContext'
import { useDjSession } from '@/state/DjSessionContext'

export function PlaylistDetailView() {
  const { playlistId } = useParams<{ playlistId: string }>()
  const navigate = useNavigate()
  const player = usePlayer()
  const library = useLibrary()
  const dj = useDjSession()
  const playlist = PLAYLISTS.find((p) => p.id === playlistId)

  if (!playlist) {
    return <div className="text-neutral-500">Playlist not found.</div>
  }

  function handleStartFromPlaylist() {
    dj.startSession({ kind: 'playlist', playlistId: playlist!.id })
    navigate('/dj')
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-50">{playlist.title}</h1>
      <p className="mb-4 text-sm text-neutral-500">{playlist.description}</p>
      <button
        onClick={handleStartFromPlaylist}
        className="mb-8 inline-flex w-fit items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        Start a DJ session from this playlist
      </button>
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
