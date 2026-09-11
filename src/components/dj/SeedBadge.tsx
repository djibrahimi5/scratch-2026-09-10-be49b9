type SeedBadgeProps = {
  seedLabel: string | null
}

export function SeedBadge({ seedLabel }: SeedBadgeProps) {
  if (!seedLabel) return null
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-400">
      Seeded from {seedLabel}
    </span>
  )
}
