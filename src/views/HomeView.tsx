import { useNavigate } from 'react-router-dom'
import { AlbumTile } from '@/components/album/AlbumTile'
import { ShelfRow } from '@/components/album/ShelfRow'
import { CATALOG } from '@/data'
import { usePlayer } from '@/state/PlayerContext'

function albumSubtitle(albumId: string): string {
  const album = CATALOG.albumsById.get(albumId)
  if (!album) return ''
  const artist = CATALOG.artistsById.get(album.artistId)
  return artist?.name ?? ''
}

function firstTrackOfAlbum(albumId: string): string | null {
  const track = CATALOG.tracks.find((t) => t.albumId === albumId)
  return track?.id ?? null
}

export function HomeView() {
  const player = usePlayer()
  const navigate = useNavigate()

  const trendingAlbums = Array.from(
    new Set(
      [...CATALOG.tracks]
        .sort((a, b) => b.popularity - a.popularity)
        .map((t) => t.albumId),
    ),
  ).slice(0, 8)

  const recentEras = ['20s', '10s'] as const
  const newAlbums = CATALOG.albums
    .filter((a) => recentEras.includes(a.era as (typeof recentEras)[number]))
    .sort((a, b) => b.year - a.year)
    .slice(0, 8)
    .map((a) => a.id)

  const allAlbums = CATALOG.albums.map((a) => a.id).slice(0, 8)

  function playAlbum(albumId: string) {
    const trackId = firstTrackOfAlbum(albumId)
    if (trackId) player.play(trackId)
  }

  return (
    <div>
      <button
        onClick={() => navigate('/dj')}
        className="mb-10 flex w-full items-center justify-between rounded-2xl bg-gradient-to-br from-accent/30 via-neutral-900 to-neutral-900 p-8 text-left shadow-xl transition-transform hover:-translate-y-0.5"
      >
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
            AI DJ
          </div>
          <div className="text-3xl font-bold text-neutral-50">Start a session</div>
          <div className="mt-2 max-w-md text-sm text-neutral-400">
            A five-phase listening session built from your taste, adapting as you skip and save.
          </div>
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl text-white">
          ▶
        </div>
      </button>

      <ShelfRow title="Trending Now">
        {trendingAlbums.map((albumId) => {
          const album = CATALOG.albumsById.get(albumId)
          if (!album) return null
          return (
            <AlbumTile
              key={albumId}
              albumId={albumId}
              title={album.title}
              subtitle={albumSubtitle(albumId)}
              onClick={() => playAlbum(albumId)}
            />
          )
        })}
      </ShelfRow>

      <ShelfRow title="New Releases">
        {newAlbums.map((albumId) => {
          const album = CATALOG.albumsById.get(albumId)
          if (!album) return null
          return (
            <AlbumTile
              key={albumId}
              albumId={albumId}
              title={album.title}
              subtitle={albumSubtitle(albumId)}
              onClick={() => playAlbum(albumId)}
            />
          )
        })}
      </ShelfRow>

      <ShelfRow title="Full Catalog">
        {allAlbums.map((albumId) => {
          const album = CATALOG.albumsById.get(albumId)
          if (!album) return null
          return (
            <AlbumTile
              key={albumId}
              albumId={albumId}
              title={album.title}
              subtitle={albumSubtitle(albumId)}
              onClick={() => playAlbum(albumId)}
            />
          )
        })}
      </ShelfRow>
    </div>
  )
}
