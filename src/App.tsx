import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomeView } from '@/views/HomeView'
import { NewView } from '@/views/NewView'
import { RadioView } from '@/views/RadioView'
import { SearchView } from '@/views/SearchView'
import { LibraryLayout } from '@/views/library/LibraryLayout'
import { RecentlyAddedView } from '@/views/library/RecentlyAddedView'
import { ArtistsView } from '@/views/library/ArtistsView'
import { AlbumsView } from '@/views/library/AlbumsView'
import { SongsView } from '@/views/library/SongsView'
import { PlaylistDetailView } from '@/views/PlaylistDetailView'
import { DjView } from '@/views/DjView'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeView />} />
          <Route path="/new" element={<NewView />} />
          <Route path="/radio" element={<RadioView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/library" element={<LibraryLayout />}>
            <Route index element={<RecentlyAddedView />} />
            <Route path="artists" element={<ArtistsView />} />
            <Route path="albums" element={<AlbumsView />} />
            <Route path="songs" element={<SongsView />} />
          </Route>
          <Route path="/playlists/:playlistId" element={<PlaylistDetailView />} />
          <Route path="/dj" element={<DjView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
