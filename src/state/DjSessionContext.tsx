import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createSession,
  getContextCard,
  recordEvent,
  type ContextCard,
  type DJEvent,
  type Phase,
  type SeedSource,
  type SessionEvent,
  type SessionState,
} from '@/dj'
import { CATALOG, FRIEND, PLAYLISTS } from '@/data'
import { usePlayer } from './PlayerContext'
import { useLibrary } from './LibraryContext'
import { loadLastSession, loadSessionState, saveLastSession, saveSessionState } from '@/lib/storage'

// Demo-fixture accommodation (see PHASE_3_NOTES.md): the 120-track catalog only keeps the
// session-level pool ratio within tolerance for seeds 1-5, so the runtime seed is drawn from a
// fixed, rotating list rather than any random source. "The DJ layer" in the Phase 3 brief is
// interpreted as this provider (the Phase 3 feature layer), not src/dj/, since the constant has
// no engine relevance and src/dj/ changes are reserved for genuinely-needed pure selectors.
const DEMO_SEEDS = [1, 2, 3, 4, 5] as const

type TransitionEvent = { event: SessionEvent; seq: number }

type DjSessionContextValue = {
  session: SessionState | null
  currentTrackId: string | null
  currentPhase: Phase | null
  currentCard: ContextCard | null
  upcoming: string[]
  lastTransitionEvent: TransitionEvent | null
  seedLabel: string | null
  startSession: (seedSource?: SeedSource) => void
  saveCurrent: () => void
  isSaved: (trackId: string) => boolean
}

// Human-readable description of an active session's seed, for the seed badge and session
// summary. Lives here (the DJ feature layer) rather than in src/dj/, matching the existing
// precedent of DEMO_SEEDS/currentTrackOf/unplayedFrom: it only needs public SessionState fields
// plus @/data lookups, not engine-internal knowledge.
export function resolveSeedLabel(seedSource: SeedSource): string | null {
  switch (seedSource.kind) {
    case 'default':
      return null
    case 'song':
      return CATALOG.tracksById.get(seedSource.trackId)?.title ?? null
    case 'artist':
      return CATALOG.artistsById.get(seedSource.artistId)?.name ?? null
    case 'library':
      return 'Your library'
    case 'playlist':
      return PLAYLISTS.find((p) => p.id === seedSource.playlistId)?.title ?? null
    case 'friendPlaylist':
      return seedSource.friendId === FRIEND.id ? FRIEND.playlist.title : null
  }
}

const SEED_SOURCE_KINDS = ['default', 'song', 'artist', 'library', 'playlist', 'friendPlaylist'] as const

// Guards against startSession being passed directly as an event handler (e.g. `onClick={dj.startSession}`),
// where React would otherwise call it with a SyntheticEvent in place of a SeedSource.
function isSeedSource(value: unknown): value is SeedSource {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    (SEED_SOURCE_KINDS as readonly string[]).includes((value as { kind: unknown }).kind as string)
  )
}

const DjSessionContext = createContext<DjSessionContextValue | null>(null)

function currentTrackOf(state: SessionState): string | null {
  const phase = state.phases[state.currentPhaseIndex]
  return phase?.plannedTrackIds[state.currentTrackIndex] ?? null
}

// Scans playedTrackIds (the only append-only, always-consistent field) rather than trusting
// currentTrackIndex, which recordEvent leaves stale on a phase cut-short until the next
// trackStart arrives. Starting the phase loop at currentPhaseIndex means a replan can never pull
// the scan backwards.
function unplayedFrom(state: SessionState, exclude: string | null): string[] {
  const played = new Set(state.playedTrackIds)
  const out: string[] = []
  for (let p = state.currentPhaseIndex; p < state.phases.length; p++) {
    for (const id of state.phases[p].plannedTrackIds) {
      if (played.has(id) || id === exclude) continue
      out.push(id)
    }
  }
  return out
}

function nextUnplayedTrackId(state: SessionState): string | null {
  return unplayedFrom(state, null)[0] ?? null
}

function nextRotationIndex(): number {
  const last = loadLastSession()
  if (!last) return 0
  const idx = DEMO_SEEDS.indexOf(last.seed as (typeof DEMO_SEEDS)[number])
  return idx === -1 ? 0 : (idx + 1) % DEMO_SEEDS.length
}

export function DjSessionProvider({ children }: { children: ReactNode }) {
  const player = usePlayer()
  const library = useLibrary()

  const [session, setSession] = useState<SessionState | null>(() => {
    const loaded = loadSessionState()
    return loaded && loaded.status === 'active' ? loaded : null
  })

  const rotationRef = useRef<number>(nextRotationIndex())
  const sessionStartRef = useRef<number>(Date.now())
  const since = useCallback(() => Date.now() - sessionStartRef.current, [])

  const pendingAdvanceRef = useRef<{ nextId: string | null } | null>(null)
  const prevEventLogLenRef = useRef<number>(session?.eventLog.length ?? 0)
  const seqRef = useRef(0)
  const [lastTransitionEvent, setLastTransitionEvent] = useState<TransitionEvent | null>(null)

  // Syncs PlayerContext to a resumed session exactly once. PlayerContext resets to its defaults
  // on a full page reload, but SessionState is restored from localStorage — without this, the
  // view would briefly (or permanently, if the effect never ran) show "nothing playing" for an
  // active session. setDjPlayback always starts playback, so togglePlay immediately pauses it;
  // both setIsPlaying calls land in the same batch, so the final committed value is false.
  // useLayoutEffect (not useEffect) avoids a visible "nothing playing" flash before the sync runs.
  const resumedRef = useRef(false)
  useLayoutEffect(() => {
    if (resumedRef.current) return
    resumedRef.current = true
    if (session && session.status === 'active') {
      const trackId = currentTrackOf(session)
      if (trackId) {
        player.setDjPlayback(trackId)
        player.togglePlay()
      }
    }
    // Intentionally runs once at mount against the session captured by the lazy initializer above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyEvent = useCallback((event: DJEvent) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = recordEvent(prev, event)
      if (event.type === 'trackComplete' || event.type === 'skip') {
        pendingAdvanceRef.current = { nextId: nextUnplayedTrackId(next) }
      }
      return next
    })
  }, [])

  // Registered against the individually-stable onTrackComplete/onTrackSkip functions (destructured
  // so the effect never references the whole `player` object, which is a new reference on every
  // playback tick since PlayerContext's memoized value depends on positionSec).
  const { onTrackComplete, onTrackSkip } = player
  useEffect(() => {
    onTrackComplete((trackId) => applyEvent({ type: 'trackComplete', trackId, atMs: since() }))
    onTrackSkip((trackId, positionFraction) =>
      applyEvent({ type: 'skip', trackId, positionFraction, atMs: since() }),
    )
  }, [onTrackComplete, onTrackSkip, applyEvent, since])

  // Advances to the next track (or ends the session) immediately after any skip/complete is
  // committed. This must fire synchronously after every skip/complete because currentTrackIndex
  // is only corrected by the next trackStart — the follow-up call here is that trackStart.
  useEffect(() => {
    const pending = pendingAdvanceRef.current
    if (pending === null) return
    pendingAdvanceRef.current = null
    if (pending.nextId) {
      const nextId = pending.nextId
      player.setDjPlayback(nextId)
      setSession((prev) => (prev ? recordEvent(prev, { type: 'trackStart', trackId: nextId, atMs: since() }) : prev))
    } else {
      setSession((prev) => (prev ? recordEvent(prev, { type: 'endSession', atMs: since() }) : prev))
      player.setDjPlayback(null)
    }
  }, [session, player, since])

  // Tail-diffs eventLog for a new phaseTransition/phaseCutShort rather than just watching its
  // length, since most event types append to the log. `seq` only advances on a genuine
  // occurrence, so PhaseBanner's dismiss timer never re-fires on an unrelated re-render.
  useEffect(() => {
    if (!session) return
    const prevLen = prevEventLogLenRef.current
    prevEventLogLenRef.current = session.eventLog.length
    const newTail = session.eventLog.slice(prevLen)
    const found = [...newTail].reverse().find((e) => e.type === 'phaseTransition' || e.type === 'phaseCutShort')
    if (found) {
      seqRef.current += 1
      setLastTransitionEvent({ event: found, seq: seqRef.current })
    }
  }, [session])

  // Persistence lives in its own effect keyed on the committed session, never inside the
  // setSession updater above: React (StrictMode, dev-only) double-invokes updaters to surface
  // impurities, and persisting inside one risks writing a value whose result gets discarded. An
  // effect only ever runs against what was actually committed and rendered.
  useEffect(() => {
    if (!session) return
    saveSessionState(session)
    if (import.meta.env.DEV) {
      const missing = session.savedThisSession.filter((id) => !library.isInLibrary(id))
      if (missing.length > 0) {
        console.warn('[dj] saved in session but not in library:', missing)
      }
    }
  }, [session, library])

  const startSession = useCallback((seedSourceArg?: SeedSource) => {
    const seedSource: SeedSource = isSeedSource(seedSourceArg) ? seedSourceArg : { kind: 'default' }
    const seed = DEMO_SEEDS[rotationRef.current % DEMO_SEEDS.length]
    rotationRef.current += 1
    sessionStartRef.current = Date.now()
    const now = new Date()
    const fresh = createSession({ seed, now, seedSource })
    const firstId = currentTrackOf(fresh)
    if (!firstId) return
    const started = recordEvent(fresh, { type: 'trackStart', trackId: firstId, atMs: since() })
    saveLastSession({ seed, seedSource, startedAt: now.toISOString() })
    setSession(started)
    player.setDjPlayback(firstId)
  }, [player, since])

  const currentTrackId = player.mode === 'dj' ? player.currentTrackId : null

  const saveCurrent = useCallback(() => {
    if (!currentTrackId || library.isInLibrary(currentTrackId)) return
    library.addToLibrary(currentTrackId)
    setSession((prev) => (prev ? recordEvent(prev, { type: 'save', trackId: currentTrackId, atMs: since() }) : prev))
  }, [currentTrackId, library, since])

  const isSaved = useCallback((trackId: string) => library.isInLibrary(trackId), [library])

  const currentPhase = session ? (session.phases[session.currentPhaseIndex] ?? null) : null

  const currentCard = useMemo(() => {
    if (!session || !currentTrackId) return null
    return getContextCard(session, currentTrackId)
  }, [session, currentTrackId])

  const upcoming = useMemo(() => (session ? unplayedFrom(session, currentTrackId) : []), [session, currentTrackId])

  const seedLabel = useMemo(() => (session ? resolveSeedLabel(session.seedSource) : null), [session])

  const value = useMemo<DjSessionContextValue>(
    () => ({
      session,
      currentTrackId,
      currentPhase,
      currentCard,
      upcoming,
      lastTransitionEvent,
      seedLabel,
      startSession,
      saveCurrent,
      isSaved,
    }),
    [
      session,
      currentTrackId,
      currentPhase,
      currentCard,
      upcoming,
      lastTransitionEvent,
      seedLabel,
      startSession,
      saveCurrent,
      isSaved,
    ],
  )

  return <DjSessionContext.Provider value={value}>{children}</DjSessionContext.Provider>
}

export function useDjSession(): DjSessionContextValue {
  const ctx = useContext(DjSessionContext)
  if (!ctx) throw new Error('useDjSession must be used within DjSessionProvider')
  return ctx
}
