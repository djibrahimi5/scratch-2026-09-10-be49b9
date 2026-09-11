import { createRng, type RNG } from '@/lib/prng'

/**
 * SessionState is plain JSON, so it cannot hold a live RNG closure. Instead it
 * carries a numeric `rngCursor`: the count of random draws made so far. To get
 * a usable generator, rebuild it from `seed` and fast-forward `cursor` draws,
 * then count how many more draws the caller makes so the new cursor can be
 * written back onto the next state. Same seed + same cursor always replays
 * the same sequence, so this survives `JSON.parse(JSON.stringify(state))`.
 */
export function withRng<T>(
  seed: number,
  cursor: number,
  fn: (rng: RNG) => T,
): { value: T; cursor: number } {
  const rng = createRng(seed)
  for (let i = 0; i < cursor; i++) rng()

  let draws = 0
  const counting: RNG = () => {
    draws++
    return rng()
  }

  const value = fn(counting)
  return { value, cursor: cursor + draws }
}
