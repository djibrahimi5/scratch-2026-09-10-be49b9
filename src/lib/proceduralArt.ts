import { createRng, hashStringToInt, rngFloat, rngInt, rngPick } from './prng'

export type ArtShape = 'stripes' | 'circles' | 'grid' | 'blob' | 'triangle'

const SHAPES: ArtShape[] = ['stripes', 'circles', 'grid', 'blob', 'triangle']

export type AlbumArtSpec = {
  hue1: number
  hue2: number
  saturation: number
  lightness: number
  angleDeg: number
  shape: ArtShape
  shapeOpacity: number
  shapeSeed: number
}

/** Deterministic album art spec derived from the album id — same id, same art, always. */
export function generateAlbumArt(albumId: string): AlbumArtSpec {
  const rng = createRng(hashStringToInt(albumId))

  const hue1 = rngInt(rng, 0, 360)
  const hueOffset = rngPick(rng, [-140, -100, -60, 60, 100, 140])
  const hue2 = (hue1 + hueOffset + 360) % 360
  const saturation = rngInt(rng, 55, 75)
  const lightness = rngInt(rng, 30, 50)
  const angleDeg = rngInt(rng, 0, 360)
  const shape = rngPick(rng, SHAPES)
  const shapeOpacity = rngFloat(rng, 0.15, 0.4)
  const shapeSeed = rngInt(rng, 0, 1_000_000)

  return { hue1, hue2, saturation, lightness, angleDeg, shape, shapeOpacity, shapeSeed }
}

export function hsl(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
