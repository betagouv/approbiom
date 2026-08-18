export const AVIS_CRB = [
    'Avis favorable',
    'Avis favorable avec réserves',
    'Avis réservé',
    'En attente',
    'Non demandé',
    'Avis défavorable',
] as const

export type AvisCRB = (typeof AVIS_CRB)[number]

export function isAvisCRB(value: unknown): value is AvisCRB {
    return AVIS_CRB.includes(value as AvisCRB)
}
