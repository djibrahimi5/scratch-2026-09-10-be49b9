import { Outlet } from 'react-router-dom'

export function LibraryLayout() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-neutral-50">Library</h1>
      <Outlet />
    </div>
  )
}
