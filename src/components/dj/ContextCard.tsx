import type { ContextCard as ContextCardData } from '@/dj'

type ContextCardProps = {
  card: ContextCardData
}

// The DJ's commentary is sourced, never generated: editorialText is track.editorialNote
// verbatim, or null. When null, this renders a fixed, byte-identical chrome label — interface
// text about the absence of a note, not commentary about the music — and nothing else.
export function ContextCard({ card }: ContextCardProps) {
  return (
    <div className="dj-fade-in rounded-xl border border-white/5 bg-neutral-900 p-5">
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
        {card.sourceLabel}
      </div>
      {card.editorialText ? (
        <p className="mb-2 text-sm italic text-neutral-200">{card.editorialText}</p>
      ) : (
        <p className="mb-2 text-sm italic text-neutral-600">No editorial note for this track.</p>
      )}
      <p className="text-sm text-neutral-400">{card.reasonLine}</p>
      {card.attribution && <p className="mt-2 text-xs text-neutral-500">{card.attribution}</p>}
    </div>
  )
}
