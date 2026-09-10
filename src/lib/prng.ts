export type RNG = () => number // float in [0, 1)

/** mulberry32 — small, fast, seeded PRNG. */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** djb2 string hash, folded into a 32-bit int usable as a PRNG seed. */
export function hashStringToInt(s: string): number {
  let hash = 5381
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i)
  }
  return hash >>> 0
}

export function createRng(seed: number | string): RNG {
  const numericSeed = typeof seed === 'string' ? hashStringToInt(seed) : seed
  return mulberry32(numericSeed)
}

export function rngInt(rng: RNG, min: number, maxExclusive: number): number {
  return min + Math.floor(rng() * (maxExclusive - min))
}

export function rngFloat(rng: RNG, min: number, max: number): number {
  return min + rng() * (max - min)
}

export function rngPick<T>(rng: RNG, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('rngPick: items must not be empty')
  }
  return items[rngInt(rng, 0, items.length)]
}

export function rngShuffle<T>(rng: RNG, items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = rngInt(rng, 0, i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function rngWeightedPick<T>(rng: RNG, items: readonly T[], weights: number[]): T {
  if (items.length === 0) {
    throw new Error('rngWeightedPick: items must not be empty')
  }
  const total = weights.reduce((sum, w) => sum + Math.max(w, 0), 0)
  if (total <= 0) {
    return rngPick(rng, items)
  }
  let target = rng() * total
  for (let i = 0; i < items.length; i++) {
    target -= Math.max(weights[i], 0)
    if (target <= 0) {
      return items[i]
    }
  }
  return items[items.length - 1]
}
