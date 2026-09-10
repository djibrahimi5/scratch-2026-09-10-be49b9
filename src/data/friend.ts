import type { FriendProfile } from './types'

// Skewed to sunrise / anthem / warm-up — tags the user's library and play
// history barely touch — so a friend-seeded session (P2) reads as
// noticeably different from the user's own default sessions.
export const FRIEND: FriendProfile = {
  id: 'friend-jordan',
  name: 'Jordan',
  playlist: {
    id: 'playlist-jordans-mix',
    title: "Jordan's Morning Mix",
    trackIds: [
      'track-dust-roads-01',
      'track-dust-roads-02',
      'track-dust-roads-03',
      'track-dust-roads-04',
      'track-morning-static-01',
      'track-morning-static-02',
      'track-morning-static-04',
      'track-sugar-static-04',
      'track-fast-forward-01',
      'track-fast-forward-02',
      'track-fast-forward-04',
      'track-rewind-city-02',
      'track-rewind-city-03',
      'track-rewind-city-04',
      'track-concrete-bloom-01',
      'track-static-bloom-03',
      'track-glass-horizon-02',
      'track-neon-vows-03',
      'track-slow-channel-02',
      'track-pixel-bloom-03',
    ],
  },
}
