import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { NowPlayingBar } from './NowPlayingBar'
import { ConceptBadge } from './ConceptBadge'
import { DebugPanel } from '@/components/debug/DebugPanel'

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-neutral-950">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
      <NowPlayingBar />
      <ConceptBadge />
      <DebugPanel />
    </div>
  )
}
