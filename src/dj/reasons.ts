import type { Track } from '@/data/types'
import type { ContextCard, ScoredTrack, SeedSource } from './types'

function reasonLineFor(scored: ScoredTrack): string {
  const tagList = scored.reasonTags.join(', ')
  switch (scored.sourceLabel) {
    case 'library':
      return tagList
        ? `From your ${tagList} listening.`
        : "You've had this one in your library a while."
    case 'tasteMatch':
      return tagList
        ? `Matches the ${tagList} run you've been on.`
        : 'Matches your recent taste.'
    case 'trending':
      return tagList
        ? `Trending with listeners who share your ${tagList} taste.`
        : 'Trending with listeners who share your taste.'
  }
}

export function buildContextCard(args: {
  track: Track
  scored: ScoredTrack | undefined
  seedSource: SeedSource
  friendName?: string
}): ContextCard {
  const { track, scored, seedSource, friendName } = args

  if (!scored) {
    throw new Error(
      `buildContextCard: no ScoredTrack recorded for "${track.id}" — every planned track must be scored by pool.ts.`,
    )
  }

  const card: ContextCard = {
    sourceLabel: track.editorialNote ? "Editor's note" : 'Why this pick',
    editorialText: track.editorialNote,
    reasonLine: reasonLineFor(scored),
  }

  if (seedSource.kind === 'friendPlaylist' && friendName) {
    card.attribution = `From ${friendName}'s taste`
  }

  return card
}
