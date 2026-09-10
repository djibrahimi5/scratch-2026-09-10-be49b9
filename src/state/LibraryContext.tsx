import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { USER } from '@/data'
import { loadLibraryAdditions, saveLibraryAdditions } from '@/lib/storage'

type LibraryContextValue = {
  libraryIds: string[]
  isInLibrary: (trackId: string) => boolean
  addToLibrary: (trackId: string) => void
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

  const value = useMemo(
    () => ({ libraryIds, isInLibrary, addToLibrary }),
    [libraryIds, isInLibrary, addToLibrary],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
