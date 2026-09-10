import { useMemo, useState } from 'react'
import { TrackRow } from '@/components/track/TrackRow'
import { CATALOG } from '@/data'
import { usePlayer } from '@/state/PlayerContext'
import { useLibrary } from '@/state/LibraryContext'

export function SearchView() {
  const [query, setQuery] = useState('')
  const player = usePlayer()
  const library = useLibrary()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return CATALOG.tracks
      .filter((track) => {
        const artist = CATALOG.artistsById.get(track.artistId)
        const album = CATALOG.albumsById.get(track.albumId)
        return (
          track.title.toLowerCase().includes(q) ||
          artist?.name.toLowerCase().includes(q) ||
          album?.title.toLowerCase().includes(q)
        )
      })
      .slice(0, 40)
  }, [query])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-50">Search</h1>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Artists, songs, albums"
        className="mb-8 w-full max-w-lg rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-accent"
      />
      {query && results.length === 0 && (
        <div className="text-sm text-neutral-500">No results for "{query}"</div>
      )}
      <div className="max-w-2xl">
        {results.map((track) => (
          <TrackRow
            key={track.id}
            trackId={track.id}
            isPlaying={player.currentTrackId === track.id}
            isSaved={library.isInLibrary(track.id)}
            onPlay={() => player.play(track.id)}
            onSave={() => library.addToLibrary(track.id)}
          />
        ))}
      </div>
    </div>
  )
}
