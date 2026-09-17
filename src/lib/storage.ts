import type { SeedSource, SessionState } from '@/dj/types'

const PREFIX = 'muse:'
const SCHEMA_VERSION = 1

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage unavailable or full — fail silently, nothing user-visible depends on it
  }
}

export function ensureSchemaVersion(): void {
  const current = readJson<number>('schemaVersion')
  if (current !== SCHEMA_VERSION) {
    writeJson('schemaVersion', SCHEMA_VERSION)
  }
}

export function loadLibraryAdditions(): string[] {
  return readJson<string[]>('library') ?? []
}

export function saveLibraryAdditions(ids: string[]): void {
  writeJson('library', ids)
}

export type LastSession = { seed: number; seedSource: SeedSource; startedAt: string }

export function loadLastSession(): LastSession | null {
  return readJson<LastSession>('lastSession')
}

export function saveLastSession(value: LastSession): void {
  writeJson('lastSession', value)
}

export type DemoSpeed = 1 | 10 | 60

export function loadDemoSpeed(): DemoSpeed {
  const value = readJson<DemoSpeed>('demoSpeed')
  return value === 1 || value === 10 || value === 60 ? value : 1
}

export function saveDemoSpeed(value: DemoSpeed): void {
  writeJson('demoSpeed', value)
}

export function loadSessionState(): SessionState | null {
  return readJson<SessionState>('djSession')
}

export function saveSessionState(state: SessionState): void {
  writeJson('djSession', state)
}

export function clearSessionState(): void {
  try {
    localStorage.removeItem(PREFIX + 'djSession')
  } catch {
    // localStorage unavailable — fail silently, nothing user-visible depends on it
  }
}

// Prefix-based: every key this module writes lives under PREFIX, so wiping all of them is
// equivalent to a first-visit state without needing to name each one individually here.
export function clearAllPersistedState(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX)) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    // localStorage unavailable — fail silently, nothing user-visible depends on it
  }
}
