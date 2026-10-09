import type { Provenance } from '@shared/core/domain/value-objects/provenance'

export const EXPLICIT = 'Explicite'
export const EVEN_SPLIT = 'Répartition égale'
export const NEEDS_REVIEW = 'À vérifier'
export const UNRESOLVED = 'Non résolu'

export type Confidence =
    | typeof EXPLICIT
    | typeof EVEN_SPLIT
    | typeof NEEDS_REVIEW
    | typeof UNRESOLVED

export type ProvenanceRepartition = {
    source: Provenance['source']
    provenance: string
    percentage: number
}

export type ProvenanceParseResults = {
    distribution: ProvenanceRepartition[]
    confidence: Confidence
    unrecognized: string[]
}
