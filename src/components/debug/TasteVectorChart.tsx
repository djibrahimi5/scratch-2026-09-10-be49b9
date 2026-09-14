import { TAG_IDS } from '@/data/tags'
import type { TasteVector } from '@/dj'

type TasteVectorChartProps = {
  base: TasteVector
  live: TasteVector
}

// Base vs. live taste vector, side by side per tag — the clearest visible proof the DJ actually
// adapts to skips and completes. Bar widths are scaled against the largest value present across
// both vectors (not a fixed 0-1 scale) so a shift reads clearly even when every value is small.
export function TasteVectorChart({ base, live }: TasteVectorChartProps) {
  const max = Math.max(0.001, ...TAG_IDS.map((tag) => Math.max(base[tag], live[tag])))

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-[11px] font-medium text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-neutral-500" /> Base (session start)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" /> Live (adapted)
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {TAG_IDS.map((tag) => (
          <div key={tag} className="flex items-center gap-3">
            <div className="w-24 shrink-0 truncate text-xs text-neutral-400">{tag}</div>
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-neutral-500"
                  style={{ width: `${(base[tag] / max) * 100}%` }}
                />
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(live[tag] / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
