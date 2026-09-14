import { useEffect, useMemo, useRef, useState } from 'react'
import { ARTISTS, CATALOG, FRIEND, PLAYLISTS } from '@/data'
import { useDjSession } from '@/state/DjSessionContext'
import type { SeedSource } from '@/dj'

type SeedPickerProps = {
  isOpen: boolean
  onClose: () => void
}

const SONG_RESULT_LIMIT = 8

// Always mounted (never conditionally rendered by the parent) so enter/exit transitions have
// something to animate — visibility is entirely driven by `isOpen` via opacity/transform classes.
export function SeedPicker({ isOpen, onClose }: SeedPickerProps) {
  const dj = useDjSession()
  const [songQuery, setSongQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

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

  // Move focus into the modal on open, and back to whatever had focus before (the "Start from…"
  // trigger, in practice) on close.
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null
      inputRef.current?.focus()
    } else {
      previouslyFocusedRef.current?.focus?.()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  function handleSelect(seedSource: SeedSource) {
    dj.startSession(seedSource)
    onClose()
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div
        role="dialog"
        aria-label="Start a session from…"
        className={`flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-white/5 bg-neutral-900 p-6 transition-all duration-200 ${
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-2 scale-95'
        }`}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-50">Start from…</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
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
              ref={inputRef}
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
