import { useMemo, useState } from 'react'
import { ARTISTS, CATALOG, FRIEND, PLAYLISTS } from '@/data'
import { useDjSession } from '@/state/DjSessionContext'
import type { SeedSource } from '@/dj'

type SeedPickerProps = {
  onClose: () => void
}

const SONG_RESULT_LIMIT = 8

export function SeedPicker({ onClose }: SeedPickerProps) {
  const dj = useDjSession()
  const [songQuery, setSongQuery] = useState('')

  const songResults = useMemo(() => {
    const q = songQuery.trim().toLowerCase()
    if (!q) return []
    return CATALOG.tracks
      .filter((track) => {
        const artist = CATALOG.artistsById.get(track.artistId)
        return track.title.toLowerCase().includes(q) || artist?.name.toLowerCase().includes(q)
      })
      .slice(0, SONG_RESULT_LIMIT)
  }, [songQuery])

  function handleSelect(seedSource: SeedSource) {
    dj.startSession(seedSource)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-white/5 bg-neutral-900 p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-50">Start from…</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
            title="Close"
          >
            ✕
          </button>
        </div>
        <p className="mb-6 text-xs text-neutral-500">
          Choosing something below only gives the DJ a starting point — it still builds and adapts
          the whole session itself.
        </p>

        <div className="flex flex-col gap-5">
          <section>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">A song</div>
            <input
              autoFocus
              value={songQuery}
              onChange={(e) => setSongQuery(e.target.value)}
              placeholder="Search songs or artists"
              className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-accent"
            />
            {songQuery && songResults.length === 0 && (
              <div className="px-1 py-1 text-xs text-neutral-500">No matches for "{songQuery}"</div>
            )}
            <div className="flex flex-col">
              {songResults.map((track) => {
                const artist = CATALOG.artistsById.get(track.artistId)
                return (
                  <button
                    key={track.id}
                    onClick={() => handleSelect({ kind: 'song', trackId: track.id })}
                    className="rounded-lg px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5"
                  >
                    <span className="text-neutral-100">{track.title}</span>
                    <span className="text-neutral-500"> — {artist?.name}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">An artist</div>
            <div className="flex max-h-40 flex-col overflow-y-auto">
              {ARTISTS.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleSelect({ kind: 'artist', artistId: artist.id })}
                  className="rounded-lg px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5"
                >
                  {artist.name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">My library</div>
            <button
              onClick={() => handleSelect({ kind: 'library' })}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5"
            >
              Start from my library
            </button>
          </section>

          <section>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">A playlist</div>
            <div className="flex flex-col">
              {PLAYLISTS.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleSelect({ kind: 'playlist', playlistId: playlist.id })}
                  className="rounded-lg px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5"
                >
                  {playlist.title}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-accent/30 bg-accent/5 p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
              A friend's playlist
            </div>
            <button
              onClick={() => handleSelect({ kind: 'friendPlaylist', friendId: FRIEND.id })}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/10"
            >
              Start from {FRIEND.name}'s playlist — {FRIEND.playlist.title}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
