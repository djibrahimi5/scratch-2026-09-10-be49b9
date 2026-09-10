export function DjView() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">AI DJ</div>
      <h1 className="mb-3 text-3xl font-bold text-neutral-50">Coming up next</h1>
      <p className="max-w-md text-sm text-neutral-500">
        The DJ engine and session view are built in later phases. This route is wired up so
        navigation and the shell are complete.
      </p>
    </div>
  )
}
