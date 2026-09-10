import { useMemo } from 'react'
import { generateAlbumArt, hsl } from '@/lib/proceduralArt'

type Props = {
  albumId: string
  size?: number
  className?: string
  rounded?: string
}

function ShapeOverlay({
  shape,
  seed,
}: {
  shape: ReturnType<typeof generateAlbumArt>['shape']
  seed: number
}) {
  // Deterministic pseudo-values derived from the shape seed, no extra RNG plumbing needed here.
  const n = (offset: number) => ((seed + offset * 7919) % 97) / 97

  switch (shape) {
    case 'stripes':
      return (
        <g>
          {Array.from({ length: 6 }).map((_, i) => (
            <line
              key={i}
              x1={-20 + i * 22}
              y1={120}
              x2={20 + i * 22}
              y2={-20}
              stroke="white"
              strokeWidth={6}
            />
          ))}
        </g>
      )
    case 'circles':
      return (
        <g>
          {Array.from({ length: 4 }).map((_, i) => (
            <circle
              key={i}
              cx={50}
              cy={50}
              r={12 + i * 14}
              fill="none"
              stroke="white"
              strokeWidth={3}
            />
          ))}
        </g>
      )
    case 'grid': {
      const dots = []
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          dots.push(
            <circle key={`${x}-${y}`} cx={10 + x * 20} cy={10 + y * 20} r={3.5} fill="white" />,
          )
        }
      }
      return <g>{dots}</g>
    }
    case 'blob': {
      const r1 = 20 + n(1) * 20
      const r2 = 20 + n(2) * 20
      const r3 = 20 + n(3) * 20
      const r4 = 20 + n(4) * 20
      return (
        <path
          d={`M 50 ${50 - r1} C ${50 + r2} ${50 - r1}, ${50 + r2} ${50 + r3}, 50 ${50 + r3} C ${50 - r4} ${50 + r3}, ${50 - r4} ${50 - r1}, 50 ${50 - r1} Z`}
          fill="white"
        />
      )
    }
    case 'triangle':
      return (
        <g>
          <polygon points="50,10 90,85 10,85" fill="white" opacity={0.6} />
          <polygon points="30,90 70,90 50,20" fill="white" opacity={0.4} />
        </g>
      )
    default:
      return null
  }
}

export function AlbumArt({ albumId, size = 160, className = '', rounded = 'rounded-xl' }: Props) {
  const spec = useMemo(() => generateAlbumArt(albumId), [albumId])
  const gradientId = `art-gradient-${albumId}`

  return (
    <div
      className={`overflow-hidden ${rounded} shadow-lg shadow-black/40 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <linearGradient
            id={gradientId}
            gradientTransform={`rotate(${spec.angleDeg}, 0.5, 0.5)`}
          >
            <stop offset="0%" stopColor={hsl(spec.hue1, spec.saturation, spec.lightness)} />
            <stop
              offset="100%"
              stopColor={hsl(spec.hue2, spec.saturation, Math.max(spec.lightness - 15, 10))}
            />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${gradientId})`} />
        <g opacity={spec.shapeOpacity}>
          <ShapeOverlay shape={spec.shape} seed={spec.shapeSeed} />
        </g>
      </svg>
    </div>
  )
}
