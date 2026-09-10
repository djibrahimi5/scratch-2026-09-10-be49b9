import type { Playlist } from './types'

// Static filler playlists — sidebar population only, not part of the DJ engine.
export const PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-late-shift',
    title: 'Late Shift',
    description: 'Low-lit tracks for after everyone else has gone home.',
    trackIds: [
      'track-after-hours-vol-1-01',
      'track-low-light-01',
      'track-second-skin-01',
      'track-nocturne-avenue-01',
      'track-overnight-freeway-01',
      'track-slow-room-02',
    ],
  },
  {
    id: 'playlist-open-road',
    title: 'Open Road',
    description: 'For the long stretch of highway with nothing else on it.',
    trackIds: [
      'track-redline-nights-01',
      'track-redline-nights-04',
      'track-wire-and-salt-01',
      'track-overnight-freeway-02',
      'track-voltage-bloom-02',
      'track-morning-static-02',
    ],
  },
]
