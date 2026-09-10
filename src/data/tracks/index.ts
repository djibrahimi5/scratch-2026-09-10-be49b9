import type { Track } from '../types'
import { TRACKS_70S } from './era70s'
import { TRACKS_80S } from './era80s'
import { TRACKS_90S } from './era90s'
import { TRACKS_00S } from './era00s'
import { TRACKS_10S } from './era10s'
import { TRACKS_20S } from './era20s'

export const TRACKS: Track[] = [
  ...TRACKS_70S,
  ...TRACKS_80S,
  ...TRACKS_90S,
  ...TRACKS_00S,
  ...TRACKS_10S,
  ...TRACKS_20S,
]
