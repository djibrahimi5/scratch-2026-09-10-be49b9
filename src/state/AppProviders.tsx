import type { ReactNode } from 'react'
import { LibraryProvider } from './LibraryContext'
import { PlayerProvider } from './PlayerContext'
import { DjSessionProvider } from './DjSessionContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LibraryProvider>
      <PlayerProvider>
        <DjSessionProvider>{children}</DjSessionProvider>
      </PlayerProvider>
    </LibraryProvider>
  )
}
