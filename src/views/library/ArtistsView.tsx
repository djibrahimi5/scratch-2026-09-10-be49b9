import { useMemo } from 'react'
import { CATALOG } from '@/data'
import { useLibrary } from '@/state/LibraryContext'
import { AlbumArt } from '@/components/album/AlbumArt'

export function ArtistsView() {
  const library = useLibrary()

  const artists = useMemo(() => {
    const artistIds = new Set(
      library.libraryIds
        .map((id) => CATALOG.tracksById.get(id)?.artistId)
        .filter((id): id is string => Boolean(id)),
    )
    return Array.from(artistIds)
      .map((id) => CATALOG.artistsById.get(id))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [library.libraryIds])

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {artists.map((artist) => {
        const firstAlbum = CATALOG.albums.find((a) => a.artistId === artist.id)
        return (
          <div key={artist.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5">
            {firstAlbum && <AlbumArt albumId={firstAlbum.id} size={48} rounded="rounded-full" />}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-neutral-100">{artist.name}</div>
              <div className="truncate text-xs text-neutral-500">Artist</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
