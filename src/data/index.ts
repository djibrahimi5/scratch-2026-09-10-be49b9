import { ARTISTS } from './artists'
import { ALBUMS } from './albums'
import { TRACKS } from './tracks'
import { USER } from './user'
import { FRIEND } from './friend'
import { PLAYLISTS } from './playlists'
import type { Album, Artist, Track } from './types'

export * from './types'
export * from './tags'
export { ARTISTS, ALBUMS, TRACKS, USER, FRIEND, PLAYLISTS }

export type Catalog = {
  artists: Artist[]
  albums: Album[]
  tracks: Track[]
  artistsById: Map<string, Artist>
  albumsById: Map<string, Album>
  tracksById: Map<string, Track>
}

export const CATALOG: Catalog = {
  artists: ARTISTS,
  albums: ALBUMS,
  tracks: TRACKS,
  artistsById: new Map(ARTISTS.map((a) => [a.id, a])),
  albumsById: new Map(ALBUMS.map((a) => [a.id, a])),
  tracksById: new Map(TRACKS.map((t) => [t.id, t])),
}
