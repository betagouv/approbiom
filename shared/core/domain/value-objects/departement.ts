import type { Region } from '@shared/core/domain/value-objects/region'

export type Departement = {
    dep: string
    libelle: string
    reg: Region['reg']
}

/** 01 to 95, minus 20 (now 2A/2B). */
const METROPOLE = Array.from({ length: 95 }, (_, index) =>
    String(index + 1).padStart(2, '0')
).filter((dep) => dep !== '20')

const CORSE = ['2A', '2B']

/** 975, 977 and 978 are collectivités, not départements: left out on purpose. */
const OUTRE_MER = ['971', '972', '973', '974', '976']

export const DEPARTEMENTS: readonly Departement['dep'][] = [
    ...METROPOLE,
    ...CORSE,
    ...OUTRE_MER,
]

const CODES = new Set<string>(DEPARTEMENTS)

export function isCodeDepartement(value: unknown): value is Departement['dep'] {
    return typeof value === 'string' && CODES.has(value)
}
