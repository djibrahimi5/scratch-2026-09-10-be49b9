import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function ShelfRow({ title, subtitle, children }: Props) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-bold tracking-tight text-neutral-50">{title}</h2>
        {subtitle && <span className="text-sm text-neutral-500">{subtitle}</span>}
      </div>
      <div className="flex gap-5 overflow-x-auto pb-2">{children}</div>
    </section>
  )
}
