import { describe, expect, it } from 'vitest'
import { ARTISTS, ALBUMS, TRACKS, USER, FRIEND } from '../index'
import { TAG_IDS, ERA_IDS } from '../tags'

describe('catalog data integrity', () => {
  it('has roughly 24 artists, 30 albums, 120 tracks', () => {
    expect(ARTISTS.length).toBe(24)
    expect(ALBUMS.length).toBe(30)
    expect(TRACKS.length).toBe(120)
  })

  it('has a null-editorial-note ratio between 12% and 18%', () => {
    const nullCount = TRACKS.filter((t) => t.editorialNote === null).length
    const ratio = nullCount / TRACKS.length
    expect(ratio).toBeGreaterThanOrEqual(0.12)
    expect(ratio).toBeLessThanOrEqual(0.18)
  })

  it('only uses tags from the shared vocabulary', () => {
    for (const track of TRACKS) {
      expect(track.tags.length).toBeGreaterThanOrEqual(2)
      expect(track.tags.length).toBeLessThanOrEqual(4)
      for (const tag of track.tags) {
        expect(TAG_IDS).toContain(tag)
      }
    }
  })

  it('only uses valid eras', () => {
    for (const track of TRACKS) {
      expect(ERA_IDS).toContain(track.era)
    }
    for (const album of ALBUMS) {
      expect(ERA_IDS).toContain(album.era)
    }
  })

  it('keeps energy and popularity within [0, 1]', () => {
    for (const track of TRACKS) {
      expect(track.energy).toBeGreaterThanOrEqual(0)
      expect(track.energy).toBeLessThanOrEqual(1)
      expect(track.popularity).toBeGreaterThanOrEqual(0)
      expect(track.popularity).toBeLessThanOrEqual(1)
    }
  })

  it('keeps durationSec within [150, 320]', () => {
    for (const track of TRACKS) {
      expect(track.durationSec).toBeGreaterThanOrEqual(150)
      expect(track.durationSec).toBeLessThanOrEqual(320)
    }
  })

  it('resolves every artistId and albumId reference', () => {
    const artistIds = new Set(ARTISTS.map((a) => a.id))
    const albumIds = new Set(ALBUMS.map((a) => a.id))
    for (const track of TRACKS) {
      expect(artistIds.has(track.artistId)).toBe(true)
      expect(albumIds.has(track.albumId)).toBe(true)
    }
    for (const album of ALBUMS) {
      expect(artistIds.has(album.artistId)).toBe(true)
    }
  })

  it('resolves every user library, play history, and friend playlist trackId', () => {
    const trackIds = new Set(TRACKS.map((t) => t.id))
    for (const id of USER.library) {
      expect(trackIds.has(id)).toBe(true)
    }
    for (const entry of USER.playHistory) {
      expect(trackIds.has(entry.trackId)).toBe(true)
    }
    for (const id of FRIEND.playlist.trackIds) {
      expect(trackIds.has(id)).toBe(true)
    }
  })

  it('has no duplicate track ids', () => {
    const ids = TRACKS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
