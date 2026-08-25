import { isCodeDepartement } from './departement'
import type { Departement } from './departement'

export type Commune = {
    codeInsee: string
    nom: string
}

/**
 * INSEE codes every commune on five characters, whichever side of the sea it
 * is on: `64024` Anglet, `2A004` Ajaccio, `97411` Saint-Denis.
 *
 * The code is assigned, not computed, and it outlives the name — a commune
 * that is renamed keeps its code, which is why it and not the name is what we
 * store and look up.
 */
const CODE_LENGTH = 5

/**
 * The département a commune's code opens with: three characters outre-mer, two
 * in métropole and en Corse. `undefined` when those characters name no
 * département — see `departement.ts` for the set, which leaves the
 * collectivités out on purpose.
 */
export function codeDepartementOf(
    codeInsee: Commune['codeInsee']
): Departement['dep'] | undefined {
    if (codeInsee.length !== CODE_LENGTH) return undefined

    // Read three characters first: no métropole département is coded on three,
    // so a three-character read can only succeed outre-mer, and that is what
    // tells the two lengths apart without a list of the DOM here.
    const outreMer = codeInsee.slice(0, 3)
    if (isCodeDepartement(outreMer)) return outreMer

    const metropole = codeInsee.slice(0, 2)
    return isCodeDepartement(metropole) ? metropole : undefined
}

/**
 * Whether a value is shaped like an INSEE commune code: a département we
 * recognise, followed by the digits that make up the five characters.
 *
 * This says well-formed, not existing. The list of communes is open — they
 * merge and split every 1 January — so only the dataset in
 * `shared/infrastructure/localization` can answer whether a well-formed code is
 * carried by a commune today.
 */
export function isCodeInseeCommune(
    value: unknown
): value is Commune['codeInsee'] {
    if (typeof value !== 'string') return false

    const dep = codeDepartementOf(value)
    if (dep === undefined) return false

    return /^\d+$/.test(value.slice(dep.length))
}
