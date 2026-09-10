import { AlbumArt } from './AlbumArt'

type Props = {
  albumId: string
  title: string
  subtitle: string
  onClick?: () => void
  size?: number
}

export function AlbumTile({ albumId, title, subtitle, onClick, size = 160 }: Props) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col gap-2 text-left transition-transform duration-150 hover:-translate-y-1"
      style={{ width: size }}
    >
      <AlbumArt albumId={albumId} size={size} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-neutral-100">{title}</div>
        <div className="truncate text-xs text-neutral-400">{subtitle}</div>
      </div>
    </button>
  )
}
