export const TAG_IDS = [
  'late-night',
  'sunrise',
  'driving',
  'focus',
  'heartbreak',
  'euphoric',
  'warm-up',
  'wind-down',
  'crate-digging',
  'anthem',
] as const

export type TagId = (typeof TAG_IDS)[number]

export const ERA_IDS = ['70s', '80s', '90s', '00s', '10s', '20s'] as const

export type Era = (typeof ERA_IDS)[number]

export function isTagId(value: string): value is TagId {
  return (TAG_IDS as readonly string[]).includes(value)
}

export function isEra(value: string): value is Era {
  return (ERA_IDS as readonly string[]).includes(value)
}
