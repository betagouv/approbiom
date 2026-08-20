import type { Region } from '@shared/core/domain/value-objects/region'

export type Departement = {
    dep: string
    libelle: string
    reg: Region['reg']
}

/**
 * Métropole runs from 01 to 95 — minus the 20 Corsica gave up, which INSEE has
 * left vacant ever since.
 */
const METROPOLE = Array.from({ length: 95 }, (_, index) =>
    String(index + 1).padStart(2, '0')
).filter((dep) => dep !== '20')

/**
 * What Corsica was given in exchange for 20, and the only two codes that are
 * not numbers.
 */
const CORSE = ['2A', '2B']

/**
 * The five départements d'outre-mer, coded on three characters.
 *
 * 975, 977 and 978 are absent on purpose: Saint-Pierre-et-Miquelon,
 * Saint-Barthélemy and Saint-Martin are collectivités, and a plan reported
 * under one of them is a column not saying what it is expected to say.
 */
const OUTRE_MER = ['971', '972', '973', '974', '976']

/** The 101 départements, as INSEE codes them. */
export const DEPARTEMENTS: readonly Departement['dep'][] = [
    ...METROPOLE,
    ...CORSE,
    ...OUTRE_MER,
]

const CODES = new Set<string>(DEPARTEMENTS)

/**
 * Whether a code names a département.
 *
 * The set is closed and INSEE moves it about once a generation, so a code
 * outside it is a document saying something other than a département — not a
 * département this file has not heard of yet.
 */
export function isCodeDepartement(value: unknown): value is Departement['dep'] {
    return typeof value === 'string' && CODES.has(value)
}
