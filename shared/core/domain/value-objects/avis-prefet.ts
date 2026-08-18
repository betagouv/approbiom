export const AVIS_PREFET = [
    'Avis favorable',
    'Avis favorable avec réserves',
    'Avis réservé',
    'En attente',
    'Avis défavorable',
] as const

export type AvisPrefet = (typeof AVIS_PREFET)[number]

export function isAvisPrefet(value: unknown): value is AvisPrefet {
    return AVIS_PREFET.includes(value as AvisPrefet)
}
