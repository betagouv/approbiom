import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Pays } from '@shared/core/domain/value-objects/pays'

export const DEPARTEMENT_FRANCAIS = 'Département français'

export const PAYS_ETRANGER = 'Pays étranger'

export const SOURCES_PROVENANCE = [DEPARTEMENT_FRANCAIS, PAYS_ETRANGER] as const

export type SourceProvenance = (typeof SOURCES_PROVENANCE)[number]

export function isSourceProvenance(value: unknown): value is SourceProvenance {
    return SOURCES_PROVENANCE.includes(value as SourceProvenance)
}

/**
 * Where a tonnage is drawn from: a French département, or a foreign country.
 */
export type Provenance =
    | { source: typeof DEPARTEMENT_FRANCAIS; code: Departement['dep'] }
    | { source: typeof PAYS_ETRANGER; libelle: Pays['libelle'] }

export function getProvenanceLabel(provenance: Provenance): string {
    return provenance.source === PAYS_ETRANGER
        ? provenance.libelle
        : provenance.code
}
