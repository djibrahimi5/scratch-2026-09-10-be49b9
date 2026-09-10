import type { SeedSource } from '@/dj/types'

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
