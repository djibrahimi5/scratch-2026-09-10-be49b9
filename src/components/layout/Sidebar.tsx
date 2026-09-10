import { NavLink } from 'react-router-dom'
import { PLAYLISTS } from '@/data'

function navLinkClass(isActive: boolean) {
  return `block rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/10 text-neutral-50' : 'text-neutral-400 hover:text-neutral-100'
  }`
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
      {children}
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-neutral-950 px-3 py-5">
      <div className="mb-2 px-3 text-lg font-bold tracking-tight text-neutral-50">Muse</div>

      <NavLink
        to="/dj"
        className={({ isActive }) =>
          `mb-2 block rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
            isActive ? 'bg-accent/20 text-accent' : 'text-accent hover:bg-accent/10'
          }`
        }
      >
        ✦ DJ
      </NavLink>

      <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)}>
        Home
      </NavLink>
      <NavLink to="/new" className={({ isActive }) => navLinkClass(isActive)}>
        New
      </NavLink>
      <NavLink to="/radio" className={({ isActive }) => navLinkClass(isActive)}>
        Radio
      </NavLink>
      <NavLink to="/search" className={({ isActive }) => navLinkClass(isActive)}>
        Search
      </NavLink>

      <SectionLabel>Library</SectionLabel>
      <NavLink to="/library" end className={({ isActive }) => navLinkClass(isActive)}>
        Recently Added
      </NavLink>
      <NavLink to="/library/artists" className={({ isActive }) => navLinkClass(isActive)}>
        Artists
      </NavLink>
      <NavLink to="/library/albums" className={({ isActive }) => navLinkClass(isActive)}>
        Albums
      </NavLink>
      <NavLink to="/library/songs" className={({ isActive }) => navLinkClass(isActive)}>
        Songs
      </NavLink>

      <SectionLabel>Playlists</SectionLabel>
      {PLAYLISTS.map((playlist) => (
        <NavLink
          key={playlist.id}
          to={`/playlists/${playlist.id}`}
          className={({ isActive }) => navLinkClass(isActive)}
        >
          {playlist.title}
        </NavLink>
      ))}
    </aside>
  )
}
