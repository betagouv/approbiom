import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import {
    VERIFIEE,
    type Controle,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type {
    ProvenanceParseResults,
    ProvenanceRepartition,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-provenance-repartition'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'

export type ReadLine = {
    document: string
    excelRow: number
    supplier: string
    resource: string
    tonnage: number
    rawProvenance: string
    additionalData: string
}

export type ExtractedLine = {
    read: ReadLine
    derived: {
        parsedProvenance: ProvenanceParseResults
        matchedFournisseur: Entreprise | null
        matchedRessource: Ressource | null
    }
}

export type ExtractedApprovisionnement = ExtractedLine & {
    id: number
    controle: Controle
    extractedAt: Date
}

export function isVerifiable({ derived }: ExtractedLine): boolean {
    const { distribution } = derived.parsedProvenance

    return (
        derived.matchedRessource !== null &&
        distribution.length > 0 &&
        distribution.every(({ provenance }) => provenance !== '')
    )
}

export const distributionTotal = ({ derived }: ExtractedLine): number =>
    derived.parsedProvenance.distribution.reduce(
        (total, { percentage }) => total + percentage,
        0
    )

// 0.05 absorbs the rounding of a typed percentage.
export const isNot100 = (line: ExtractedLine) =>
    line.derived.parsedProvenance.distribution.length > 0 &&
    Math.abs(distributionTotal(line) - 100) > 0.05

export const countVerified = (lines: readonly ExtractedApprovisionnement[]) =>
    lines.filter(({ controle }) => controle === VERIFIEE).length

const toProvenance = ({
    source,
    provenance,
}: ProvenanceRepartition): Provenance =>
    source === PAYS_ETRANGER
        ? { source: PAYS_ETRANGER, libelle: provenance }
        : { source: DEPARTEMENT_FRANCAIS, code: provenance }

export function toApprovisionnements(
    line: ExtractedLine,
    plan: Approvisionnement['planDApprovisionnement'],
    source: Attachment['id']
): Omit<Approvisionnement, 'id'>[] {
    const { matchedFournisseur, matchedRessource, parsedProvenance } =
        line.derived
    if (!isVerifiable(line) || !matchedRessource) return []

    return parsedProvenance.distribution.map((repartition) => ({
        planDApprovisionnement: plan,
        fournisseur: matchedFournisseur?.siret,
        ressource: matchedRessource.code,
        provenance: toProvenance(repartition),
        tonnageTotal: (line.read.tonnage * repartition.percentage) / 100,
        additionalDataFromDocument: line.read.additionalData,
        source,
    }))
}
