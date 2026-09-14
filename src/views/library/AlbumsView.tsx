import { useMemo } from 'react'
import { AlbumTile } from '@/components/album/AlbumTile'
import { CATALOG } from '@/data'
import { useLibrary } from '@/state/LibraryContext'
import { usePlayer } from '@/state/PlayerContext'

export function AlbumsView() {
  const library = useLibrary()
  const player = usePlayer()

  const albums = useMemo(() => {
    const albumIds = new Set(
      library.libraryIds
        .map((id) => CATALOG.tracksById.get(id)?.albumId)
        .filter((id): id is string => Boolean(id)),
    )
    return Array.from(albumIds)
      .map((id) => CATALOG.albumsById.get(id))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [library.libraryIds])

  function playAlbum(albumId: string) {
    const track = CATALOG.tracks.find((t) => t.albumId === albumId)
    if (track) player.play(track.id)
  }

  if (albums.length === 0) {
    return <p className="text-sm text-neutral-500">Your library is empty.</p>
  }

  return (
    <div className="flex flex-wrap gap-6">
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
    </div>
  )
}
