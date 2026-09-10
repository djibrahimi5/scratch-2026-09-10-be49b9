import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CATALOG } from '@/data'
import { usePlaybackTimer } from '@/hooks/usePlaybackTimer'
import { loadDemoSpeed, saveDemoSpeed, type DemoSpeed } from '@/lib/storage'

export type PlaybackMode = 'manual' | 'dj'

type PlayerContextValue = {
  mode: PlaybackMode
  currentTrackId: string | null
  positionSec: number
  durationSec: number | null
  isPlaying: boolean
  demoSpeed: DemoSpeed
  play: (trackId: string) => void
  togglePlay: () => void
  setDemoSpeed: (speed: DemoSpeed) => void
  /** Used by DJ mode to drive playback from externally-managed session state. */
  setDjPlayback: (trackId: string | null) => void
  /** Called whenever the current track reaches the end of its simulated duration. */
  onTrackComplete: (handler: (trackId: string) => void) => void
  skipCurrent: () => void
  onTrackSkip: (handler: (trackId: string, positionFraction: number) => void) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PlaybackMode>('manual')
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [demoSpeed, setDemoSpeedState] = useState<DemoSpeed>(() => loadDemoSpeed())
  const completeHandlerRef = useMemo(() => ({ current: null as null | ((id: string) => void) }), [])
  const skipHandlerRef = useMemo(
    () => ({ current: null as null | ((id: string, positionFraction: number) => void) }),
    [],
  )

  const track = currentTrackId ? CATALOG.tracksById.get(currentTrackId) : null
  const durationSec = track?.durationSec ?? null

  const handleComplete = useCallback(() => {
    if (!currentTrackId) return
    if (mode === 'dj' && completeHandlerRef.current) {
      completeHandlerRef.current(currentTrackId)
    } else {
      setIsPlaying(false)
    }
  }, [currentTrackId, mode, completeHandlerRef])

  const { positionSec, setPositionSec } = usePlaybackTimer({
    isPlaying,
    demoSpeed,
    durationSec,
    trackKey: currentTrackId,
    onComplete: handleComplete,
  })

  const play = useCallback((trackId: string) => {
    setMode('manual')
    setCurrentTrackId(trackId)
    setIsPlaying(true)
  }, [])

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const setDemoSpeed = useCallback((speed: DemoSpeed) => {
    setDemoSpeedState(speed)
    saveDemoSpeed(speed)
  }, [])

  const setDjPlayback = useCallback((trackId: string | null) => {
    setMode('dj')
    setCurrentTrackId(trackId)
    setIsPlaying(trackId !== null)
  }, [])

  const onTrackComplete = useCallback(
    (handler: (trackId: string) => void) => {
      completeHandlerRef.current = handler
    },
    [completeHandlerRef],
  )

  const onTrackSkip = useCallback(
    (handler: (trackId: string, positionFraction: number) => void) => {
      skipHandlerRef.current = handler
    },
    [skipHandlerRef],
  )

  const skipCurrent = useCallback(() => {
    if (!currentTrackId || !durationSec) return
    const positionFraction = positionSec / durationSec
    if (mode === 'dj' && skipHandlerRef.current) {
      skipHandlerRef.current(currentTrackId, positionFraction)
    }
    setPositionSec(0)
  }, [currentTrackId, durationSec, positionSec, mode, skipHandlerRef, setPositionSec])

  const value = useMemo<PlayerContextValue>(
    () => ({
      mode,
      currentTrackId,
      positionSec,
      durationSec,
      isPlaying,
      demoSpeed,
      play,
      togglePlay,
      setDemoSpeed,
      setDjPlayback,
      onTrackComplete,
      skipCurrent,
      onTrackSkip,
    }),
    [
      mode,
      currentTrackId,
      positionSec,
      durationSec,
      isPlaying,
      demoSpeed,
      play,
      togglePlay,
      setDemoSpeed,
      setDjPlayback,
      onTrackComplete,
      skipCurrent,
      onTrackSkip,
    ],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
