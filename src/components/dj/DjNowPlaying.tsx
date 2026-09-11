import { AlbumArt } from '@/components/album/AlbumArt'
import { SeedBadge } from '@/components/dj/SeedBadge'
import { CATALOG } from '@/data'
import { formatDuration } from '@/lib/format'
import { useDjSession } from '@/state/DjSessionContext'
import { usePlayer } from '@/state/PlayerContext'

type DjNowPlayingProps = {
  trackId: string
  isSaved: boolean
  onSave: () => void
}

export function DjNowPlaying({ trackId, isSaved, onSave }: DjNowPlayingProps) {
  const player = usePlayer()
  const dj = useDjSession()
  const track = CATALOG.tracksById.get(trackId)
  if (!track) return null
  const artist = CATALOG.artistsById.get(track.artistId)
  const progressPct =
    player.durationSec && player.currentTrackId === trackId
      ? Math.min(100, (player.positionSec / player.durationSec) * 100)
      : 0

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/5 bg-neutral-900 p-8 sm:flex-row">
      <AlbumArt albumId={track.albumId} size={160} />
      <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-4 sm:items-start">
        <SeedBadge seedLabel={dj.seedLabel} />
        <div className="min-w-0 text-center sm:text-left">
          <div className="truncate text-2xl font-bold text-neutral-50">{track.title}</div>
          <div className="truncate text-sm text-neutral-400">{artist?.name}</div>
        </div>

        <div className="flex w-full max-w-sm items-center gap-2 text-[11px] tabular-nums text-neutral-500">
          <span>{formatDuration(player.currentTrackId === trackId ? player.positionSec : 0)}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span>{formatDuration(track.durationSec)}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={player.togglePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-lg text-neutral-950"
          >
            {player.isPlaying ? '❚❚' : '▶'}
          </button>
          <button
            onClick={player.skipCurrent}
            className="text-sm font-semibold text-neutral-400 hover:text-neutral-100"
            title="Skip"
          >
            Skip ▶▶
          </button>
          <button
            onClick={onSave}
            className={`text-sm font-semibold ${
              isSaved ? 'text-accent' : 'text-neutral-400 hover:text-neutral-100'
            }`}
            title={isSaved ? 'In Library' : 'Save to Library'}
          >
            {isSaved ? '✓ Saved' : '+ Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
