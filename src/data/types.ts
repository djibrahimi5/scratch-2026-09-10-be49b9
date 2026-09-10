import type { Era, TagId } from './tags'

export type Artist = {
  id: string
  name: string
  bio: string
}

export type Album = {
  id: string
  title: string
  artistId: string
  year: number
  era: Era
}

export type Track = {
  id: string
  title: string
  artistId: string
  albumId: string
  durationSec: number
  tags: TagId[]
  era: Era
  energy: number
  popularity: number
  editorialNote: string | null
}

export type PlayHistoryEntry = {
  trackId: string
  playedAt: string // ISO date string
  completed: boolean
}

export type UserProfile = {
  library: string[]
  playHistory: PlayHistoryEntry[]
  baselineSkipRate: number
}

export type FriendProfile = {
  id: string
  name: string
  playlist: {
    id: string
    title: string
    trackIds: string[]
  }
}

export type Playlist = {
  id: string
  title: string
  description: string
  trackIds: string[]
}
