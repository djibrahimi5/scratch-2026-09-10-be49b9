import { AlbumArt } from '@/components/album/AlbumArt'
import { formatDuration } from '@/lib/format'
import { CATALOG } from '@/data'

type Props = {
  trackId: string
  index?: number
  isPlaying?: boolean
  isSaved?: boolean
  onPlay?: () => void
  onSave?: () => void
}

export function TrackRow({ trackId, index, isPlaying, isSaved, onPlay, onSave }: Props) {
  const track = CATALOG.tracksById.get(trackId)
  if (!track) return null
  const artist = CATALOG.artistsById.get(track.artistId)

  return (
    <div
      className={`group flex items-center gap-4 rounded-lg px-3 py-2 hover:bg-white/5 ${
        isPlaying ? 'bg-white/5' : ''
      }`}
    >
      {index !== undefined && (
        <div className="w-5 shrink-0 text-right text-sm tabular-nums text-neutral-500">
          {isPlaying ? <span className="text-accent">▶</span> : index + 1}
        </div>
      )}
      <AlbumArt albumId={track.albumId} size={40} rounded="rounded-md" />
      <button onClick={onPlay} className="min-w-0 flex-1 text-left">
        <div
          className={`truncate text-sm font-medium ${isPlaying ? 'text-accent' : 'text-neutral-100'}`}
        >
          {track.title}
        </div>
        <div className="truncate text-xs text-neutral-400">{artist?.name}</div>
      </button>
      {onSave && (
        <button
          onClick={onSave}
          aria-label={isSaved ? 'In Library' : 'Save to Library'}
          title={isSaved ? 'In Library' : 'Save to Library'}
          className={`shrink-0 text-xs opacity-0 transition-opacity group-hover:opacity-100 ${
            isSaved ? 'text-accent opacity-100' : 'text-neutral-400 hover:text-neutral-100'
          }`}
        >
          {isSaved ? '✓ Saved' : '+ Save'}
        </button>
      )}
      <div className="w-10 shrink-0 text-right text-xs tabular-nums text-neutral-500">
        {formatDuration(track.durationSec)}
      </div>
    </div>
  )
}
