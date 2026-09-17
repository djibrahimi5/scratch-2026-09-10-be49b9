import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { USER } from '@/data'
import { loadLibraryAdditions, saveLibraryAdditions } from '@/lib/storage'

type LibraryContextValue = {
  libraryIds: string[]
  isInLibrary: (trackId: string) => boolean
  addToLibrary: (trackId: string) => void
  resetLibrary: () => void
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [additions, setAdditions] = useState<string[]>(() => loadLibraryAdditions())

  const libraryIds = useMemo(() => {
    return Array.from(new Set([...USER.library, ...additions]))
  }, [additions])

  const isInLibrary = useCallback(
    (trackId: string) => libraryIds.includes(trackId),
    [libraryIds],
  )

  const addToLibrary = useCallback((trackId: string) => {
    setAdditions((prev) => {
      if (prev.includes(trackId) || USER.library.includes(trackId)) return prev
      const next = [...prev, trackId]
      saveLibraryAdditions(next)
      return next
    })
  }, [])

  // In-memory reset only — persisted storage is cleared centrally by
  // DjSessionContext.resetDemo via clearAllPersistedState.
  const resetLibrary = useCallback(() => {
    setAdditions([])
  }, [])

  const value = useMemo(
    () => ({ libraryIds, isInLibrary, addToLibrary, resetLibrary }),
    [libraryIds, isInLibrary, addToLibrary, resetLibrary],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
