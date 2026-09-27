import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ReadLineWithProvenanceParseResults } from '@shared/infrastructure/import-bcib-bciat/helpers'
import { gristReady } from '../helpers/grist-ready'
import { createRows } from '../helpers/grist-helpers'
import {
    TABLE,
    type AImporterApprovisionnementColumn,
} from '../types/grist-tables'

export type ApprovisionnementAImporter = ReadLineWithProvenanceParseResults & {
    planDApprovisionnement: Attachment['planDApprovisionnement']
}

export type ApprovisionnementAImporterAdapter = {
    create(lines: readonly ApprovisionnementAImporter[]): Promise<void>
}

function mapFromApplicationToGrist(
    line: ApprovisionnementAImporter
): AImporterApprovisionnementColumn {
    return {
        Plan_d_approvisionnement: line.planDApprovisionnement,
        Excel_Ademe: line.document,
        Ligne_Excel: line.excelRow,
        Fournisseur_valeur_brute: line.supplier,
        Ressource_valeur_brute: line.resource,
        Tonnage_total: line.tonnage,
        Repartition_valeur_brute: line.rawProvenance,
        Repartition_calculee_par_le_script: JSON.stringify(
            line.provenanceParseResults.distribution.map(
                ({ source, provenance, percentage }) => ({
                    source,
                    provenance,
                    pourcentage: percentage,
                    donnees_additionnelles: line.additionalData,
                })
            )
        ),
        Niveau_de_confiance: line.provenanceParseResults.confidence,
    }
}

export function createGristApprovisionnementAImporterAdapter(): ApprovisionnementAImporterAdapter {
    return {
        async create(lines) {
            await gristReady()

            await createRows(
                TABLE.aImporterApprovisionnement,
                lines.map(mapFromApplicationToGrist)
            )
        },
    }
}
