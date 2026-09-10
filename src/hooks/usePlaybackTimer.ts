import { useEffect, useRef, useState } from 'react'

const TICK_MS = 100

/**
 * Drives a simulated playback position forward at `demoSpeed`x real time.
 * Uses setInterval (not requestAnimationFrame) so progress keeps advancing
 * even when the tab is backgrounded/throttled — important for demo speed
 * control (10x/60x) to actually be visible during a screen recording.
 * Resets to 0 whenever `trackKey` changes (new track loaded).
 */
export function usePlaybackTimer(options: {
  isPlaying: boolean
  demoSpeed: number
  durationSec: number | null
  trackKey: string | null
  onComplete: () => void
}) {
  const { isPlaying, demoSpeed, durationSec, trackKey, onComplete } = options
  const [positionSec, setPositionSec] = useState(0)
  const lastTsRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setPositionSec(0)
    lastTsRef.current = null
  }, [trackKey])

  useEffect(() => {
    if (!isPlaying || durationSec === null) {
      lastTsRef.current = null
      return
    }

    lastTsRef.current = Date.now()

    const intervalId = setInterval(() => {
      const now = Date.now()
      const deltaSec = (now - (lastTsRef.current ?? now)) / 1000
      lastTsRef.current = now

      setPositionSec((prev) => {
        const next = prev + deltaSec * demoSpeed
        if (durationSec !== null && next >= durationSec) {
          queueMicrotask(() => onCompleteRef.current())
          return durationSec
        }
        return next
      })
    }, TICK_MS)

    return () => {
      clearInterval(intervalId)
      lastTsRef.current = null
    }
  }, [isPlaying, demoSpeed, durationSec, trackKey])

  return { positionSec, setPositionSec }
}
