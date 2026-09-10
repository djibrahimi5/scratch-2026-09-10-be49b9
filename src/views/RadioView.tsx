import { AlbumTile } from '@/components/album/AlbumTile'
import { ShelfRow } from '@/components/album/ShelfRow'
import { CATALOG } from '@/data'
import { usePlayer } from '@/state/PlayerContext'

export function RadioView() {
  const player = usePlayer()
  const albums = [...CATALOG.albums].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 10)

  function playAlbum(albumId: string) {
    const track = CATALOG.tracks.find((t) => t.albumId === albumId)
    if (track) player.play(track.id)
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-neutral-50">Radio</h1>
      <ShelfRow title="Stations">
        {albums.map((album) => {
          const artist = CATALOG.artistsById.get(album.artistId)
          return (
            <AlbumTile
              key={album.id}
              albumId={album.id}
              title={album.title}
              subtitle={artist?.name ?? ''}
              onClick={() => playAlbum(album.id)}
            />
          )
        })}
      </ShelfRow>
    </div>
  )
}
