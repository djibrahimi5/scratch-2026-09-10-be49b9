export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const minutes = Math.floor(s / 60)
  const seconds = s % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatSignedPercentagePoints(value: number, digits = 1): string {
  const pp = value.toFixed(digits)
  return value >= 0 ? `+${pp}pp` : `${pp}pp`
}
