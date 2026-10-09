import type { ExtractedLineChanges } from '@shared/core/application/ports/extracted-approvisionnement'
import type {
    ExtractedApprovisionnement,
    ExtractedLine,
} from '@shared/core/domain/entities/extracted-approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import {
    CONTROLES,
    NON_VERIFIEE,
    type Controle,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type { ProvenanceParseResults } from '@shared/core/domain/value-objects/extracted-approvisionnement-provenance-repartition'
import {
    asDate,
    asNumber,
    asString,
    type GristRow,
} from '../../helpers/grist-helpers'
import {
    TABLE,
    type ExtractedApprovisionnementColumn,
} from '../../types/grist-tables'

type Fields = Omit<ExtractedApprovisionnementColumn, 'id'>

export type References = {
    entrepriseIdBySiret: ReadonlyMap<Entreprise['siret'], number>
    ressourceIdByCode: ReadonlyMap<Ressource['code'], number>
}

export const toControle = (value: string): Controle =>
    CONTROLES.find((controle) => controle === value) ?? NON_VERIFIEE

export function toExtractedApprovisionnementRow(
    row: GristRow
): ExtractedApprovisionnementColumn {
    return {
        id: asNumber(row.id) ?? 0,
        Controle: asString(row.Controle),
        Document: asNumber(row.Document) ?? 0,
        Plan_d_approvisionnement: asNumber(row.Plan_d_approvisionnement) ?? 0,
        Ligne_Excel: asNumber(row.Ligne_Excel) ?? 0,
        Date_d_extraction: asNumber(row.Date_d_extraction) ?? null,
        Document_fournisseur: asString(row.Document_fournisseur),
        Document_ressource: asString(row.Document_ressource),
        Document_tonnage: asString(row.Document_tonnage),
        Document_repartition_par_provenance: asString(
            row.Document_repartition_par_provenance
        ),
        Document_donnees_additionnelles: asString(
            row.Document_donnees_additionnelles
        ),
        Fournisseur: asNumber(row.Fournisseur) ?? 0,
        Ressource: asNumber(row.Ressource) ?? 0,
        Repartition_par_provenance: asString(row.Repartition_par_provenance),
    }
}

function parseProvenance({
    id,
    Repartition_par_provenance,
}: ExtractedApprovisionnementColumn): ProvenanceParseResults {
    try {
        return JSON.parse(Repartition_par_provenance) as ProvenanceParseResults
    } catch (cause) {
        throw new Error(
            `The provenance of row ${id} of "${TABLE.extractedApprovisionnement}" is not valid JSON.`,
            { cause }
        )
    }
}

export function toExtractedApprovisionnement(
    row: ExtractedApprovisionnementColumn,
    document: string,
    fournisseur: Entreprise | undefined,
    ressource: Ressource | undefined
): ExtractedApprovisionnement {
    return {
        id: row.id,
        controle: toControle(row.Controle),
        extractedAt: asDate(row.Date_d_extraction) ?? new Date(0),
        read: {
            document,
            excelRow: row.Ligne_Excel,
            supplier: row.Document_fournisseur,
            resource: row.Document_ressource,
            tonnage: Number(row.Document_tonnage),
            rawProvenance: row.Document_repartition_par_provenance,
            additionalData: row.Document_donnees_additionnelles,
        },
        derived: {
            parsedProvenance: parseProvenance(row),
            matchedFournisseur: fournisseur ?? null,
            matchedRessource: ressource ?? null,
        },
    }
}

// Grist writes a Ref pointing at nothing as 0.
const fournisseurId = (
    fournisseur: Entreprise | null,
    { entrepriseIdBySiret }: References
) => (fournisseur ? (entrepriseIdBySiret.get(fournisseur.siret) ?? 0) : 0)

const ressourceId = (
    ressource: Ressource | null,
    { ressourceIdByCode }: References
) => (ressource ? (ressourceIdByCode.get(ressource.code) ?? 0) : 0)

export function toFields(
    { read, derived }: ExtractedLine,
    document: Pick<Fields, 'Document' | 'Plan_d_approvisionnement'>,
    extractedAt: Date,
    references: References
): Fields {
    return {
        ...document,
        Controle: NON_VERIFIEE,
        Ligne_Excel: read.excelRow,
        Date_d_extraction: extractedAt.getTime() / 1000,
        Document_fournisseur: read.supplier,
        Document_ressource: read.resource,
        Document_tonnage: String(read.tonnage),
        Document_repartition_par_provenance: read.rawProvenance,
        Document_donnees_additionnelles: read.additionalData,
        Fournisseur: fournisseurId(derived.matchedFournisseur, references),
        Ressource: ressourceId(derived.matchedRessource, references),
        Repartition_par_provenance: JSON.stringify(derived.parsedProvenance),
    }
}

export function toChangedFields(
    changes: ExtractedLineChanges,
    references: References
): Partial<Fields> {
    return {
        ...(changes.matchedFournisseur !== undefined && {
            Fournisseur: fournisseurId(changes.matchedFournisseur, references),
        }),
        ...(changes.matchedRessource !== undefined && {
            Ressource: ressourceId(changes.matchedRessource, references),
        }),
        ...(changes.parsedProvenance !== undefined && {
            Repartition_par_provenance: JSON.stringify(
                changes.parsedProvenance
            ),
        }),
        ...(changes.controle !== undefined && { Controle: changes.controle }),
    }
}
