import type { ReactNode } from 'react'
import { LibraryProvider } from './LibraryContext'
import { PlayerProvider } from './PlayerContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LibraryProvider>
      <PlayerProvider>{children}</PlayerProvider>
    </LibraryProvider>
  )
}
