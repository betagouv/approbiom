import { isCodeDepartement } from './departement'
import type { Departement } from './departement'

export type Commune = {
    codeInsee: string
    nom: string
}

/** e.g. `64024` Anglet, `2A004` Ajaccio, `97411` Saint-Denis. */
const CODE_LENGTH = 5

/** Three characters outre-mer, two in métropole and Corse. */
export function codeDepartementOf(
    codeInsee: Commune['codeInsee']
): Departement['dep'] | undefined {
    if (codeInsee.length !== CODE_LENGTH) return undefined

    // No métropole département is coded on three characters, so try three first.
    const outreMer = codeInsee.slice(0, 3)
    if (isCodeDepartement(outreMer)) return outreMer

    const metropole = codeInsee.slice(0, 2)
    return isCodeDepartement(metropole) ? metropole : undefined
}

/** Well-formed, not existing: only the referentiel-geo dataset knows current communes. */
export function isCodeInseeCommune(
    value: unknown
): value is Commune['codeInsee'] {
    if (typeof value !== 'string') return false

    const dep = codeDepartementOf(value)
    if (dep === undefined) return false

    return /^\d+$/.test(value.slice(dep.length))
}
