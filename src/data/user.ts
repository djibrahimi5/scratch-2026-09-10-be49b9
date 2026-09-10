import type { PlayHistoryEntry, UserProfile } from './types'

function isoDaysAgo(days: number, hour: number): string {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// Library skews heavily to late-night / focus / crate-digging / driving —
// the "old" taste cluster the recency-weighted taste vector should surface
// unless recent plays pull it elsewhere.
export const LIBRARY: string[] = [
  'track-after-hours-vol-1-01',
  'track-after-hours-vol-1-02',
  'track-after-hours-vol-1-03',
  'track-after-hours-vol-1-04',
  'track-low-light-01',
  'track-low-light-02',
  'track-low-light-03',
  'track-low-light-04',
  'track-second-skin-01',
  'track-second-skin-02',
  'track-second-skin-03',
  'track-second-skin-04',
  'track-drift-index-01',
  'track-drift-index-02',
  'track-drift-index-04',
  'track-quiet-machinery-01',
  'track-quiet-machinery-02',
  'track-quiet-machinery-04',
  'track-slow-room-02',
  'track-overnight-freeway-01',
  'track-overnight-freeway-02',
  'track-overnight-freeway-03',
  'track-overnight-freeway-04',
  'track-analog-grain-01',
  'track-analog-grain-02',
  'track-analog-grain-03',
  'track-analog-grain-04',
  'track-redline-nights-01',
  'track-redline-nights-02',
  'track-wire-and-salt-01',
  'track-wire-and-salt-02',
  'track-wire-and-salt-04',
  'track-chapel-sessions-03',
  'track-nocturne-avenue-01',
  'track-nocturne-avenue-02',
]

// Older plays (31-89 days ago): heavy late-night / focus / crate-digging / driving.
const OLDER_HISTORY: Array<[string, number, number, boolean]> = [
  ['track-after-hours-vol-1-01', 85, 23, true],
  ['track-low-light-02', 82, 22, true],
  ['track-drift-index-01', 80, 9, true],
  ['track-second-skin-03', 78, 21, false],
  ['track-overnight-freeway-01', 75, 23, true],
  ['track-redline-nights-01', 73, 17, true],
  ['track-analog-grain-02', 70, 22, true],
  ['track-quiet-machinery-02', 68, 10, true],
  ['track-wire-and-salt-01', 65, 18, true],
  ['track-nocturne-avenue-01', 62, 23, true],
  ['track-after-hours-vol-1-03', 60, 22, true],
  ['track-low-light-01', 58, 21, false],
  ['track-second-skin-01', 55, 22, true],
  ['track-drift-index-02', 53, 9, true],
  ['track-overnight-freeway-02', 50, 22, true],
  ['track-analog-grain-01', 48, 11, true],
  ['track-chapel-sessions-03', 45, 23, true],
  ['track-redline-nights-02', 43, 18, true],
  ['track-quiet-machinery-01', 40, 10, true],
  ['track-wire-and-salt-02', 38, 19, true],
  ['track-nocturne-avenue-02', 35, 23, true],
  ['track-after-hours-vol-1-02', 33, 22, true],
  ['track-second-skin-02', 32, 21, false],
]

// Last-30-days plays (8-30 days ago): same cluster, still building the taste shape.
const RECENT_MONTH_HISTORY: Array<[string, number, number, boolean]> = [
  ['track-low-light-03', 29, 22, true],
  ['track-drift-index-04', 27, 9, true],
  ['track-overnight-freeway-03', 25, 23, true],
  ['track-analog-grain-03', 23, 11, true],
  ['track-quiet-machinery-04', 21, 10, true],
  ['track-wire-and-salt-04', 19, 18, true],
  ['track-second-skin-04', 17, 22, true],
  ['track-after-hours-vol-1-04', 15, 23, true],
  ['track-low-light-04', 13, 22, false],
  ['track-slow-room-02', 11, 9, true],
  ['track-analog-grain-04', 10, 11, true],
  ['track-overnight-freeway-04', 9, 23, true],
  ['track-redline-nights-04', 8, 18, true],
]

// Last-7-days plays: a distinct shift toward euphoric — tracks outside the
// core library — the recency-weighted taste vector should surface this.
const LAST_WEEK_HISTORY: Array<[string, number, number, boolean]> = [
  ['track-voltage-bloom-01', 7, 20, true],
  ['track-neon-vows-01', 6, 19, true],
  ['track-pixel-bloom-01', 6, 21, true],
  ['track-sugar-static-01', 5, 17, true],
  ['track-static-halo-01', 4, 20, true],
  ['track-rewind-city-01', 3, 18, true],
  ['track-afterglow-static-04', 2, 19, true],
  ['track-morning-static-03', 2, 8, true],
  ['track-voltage-bloom-02', 1, 20, true],
  ['track-pixel-bloom-04', 1, 21, true],
  ['track-neon-vows-04', 0, 19, true],
  ['track-glass-horizon-01', 0, 20, false],
]

function buildHistory(
  rows: Array<[string, number, number, boolean]>,
): PlayHistoryEntry[] {
  return rows.map(([trackId, daysAgo, hour, completed]) => ({
    trackId,
    playedAt: isoDaysAgo(daysAgo, hour),
    completed,
  }))
}

export const PLAY_HISTORY: PlayHistoryEntry[] = [
  ...buildHistory(OLDER_HISTORY),
  ...buildHistory(RECENT_MONTH_HISTORY),
  ...buildHistory(LAST_WEEK_HISTORY),
]

export const BASELINE_SKIP_RATE = 0.12

export const USER: UserProfile = {
  library: LIBRARY,
  playHistory: PLAY_HISTORY,
  baselineSkipRate: BASELINE_SKIP_RATE,
}
