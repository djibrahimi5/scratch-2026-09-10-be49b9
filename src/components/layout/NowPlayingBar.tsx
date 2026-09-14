import { AlbumArt } from '@/components/album/AlbumArt'
import { usePlayer } from '@/state/PlayerContext'
import { useLibrary } from '@/state/LibraryContext'
import { CATALOG } from '@/data'
import { formatDuration } from '@/lib/format'
import type { DemoSpeed } from '@/lib/storage'

const SPEEDS: DemoSpeed[] = [1, 10, 60]

export function NowPlayingBar() {
  const player = usePlayer()
  const library = useLibrary()

  const track = player.currentTrackId ? CATALOG.tracksById.get(player.currentTrackId) : null
  const artist = track ? CATALOG.artistsById.get(track.artistId) : null
  const progressPct =
    track && player.durationSec ? Math.min(100, (player.positionSec / player.durationSec) * 100) : 0

  return (
    <div className="flex h-20 shrink-0 items-center gap-4 border-t border-white/5 bg-neutral-950 px-4">
      <div className="flex w-64 min-w-0 items-center gap-3">
        {track ? (
          <>
            <AlbumArt albumId={track.albumId} size={48} rounded="rounded-md" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-neutral-100">{track.title}</div>
              <div className="truncate text-xs text-neutral-400">{artist?.name}</div>
            </div>
          </>
        ) : (
          <div className="text-xs text-neutral-600">Nothing playing</div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          {player.mode === 'dj' && (
            <button
              onClick={player.skipCurrent}
              disabled={!track}
              aria-label="Skip track"
              title="Skip"
              className="text-xs font-semibold text-neutral-400 hover:text-neutral-100 disabled:opacity-30"
            >
              Skip ▶▶
            </button>
          )}
          <button
            onClick={player.togglePlay}
            disabled={!track}
            aria-label={player.isPlaying ? 'Pause' : 'Play'}
            title={player.isPlaying ? 'Pause' : 'Play'}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 disabled:opacity-30"
          >
            {player.isPlaying ? '❚❚' : '▶'}
          </button>
          {track && library.isInLibrary(track.id) && (
            <span className="text-xs text-accent" title="In Library">
              ✓
            </span>
          )}
        </div>
        <div className="flex w-full max-w-md items-center gap-2 text-[11px] tabular-nums text-neutral-500">
          <span>{formatDuration(player.positionSec)}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span>{track ? formatDuration(track.durationSec) : '0:00'}</span>
        </div>
      </div>

      <div className="flex w-64 shrink-0 items-center justify-end gap-1">
        <span className="mr-1 text-[11px] font-medium text-neutral-500">Demo speed</span>
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            onClick={() => player.setDemoSpeed(speed)}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              player.demoSpeed === speed
                ? 'bg-accent text-white'
                : 'bg-white/5 text-neutral-400 hover:text-neutral-100'
            }`}
          >
            {speed}×
          </button>
        ))}
      </div>
    </div>
  )
}
