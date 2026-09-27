import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import { gristReady } from '../helpers/grist-ready'
import { createRows } from '../helpers/grist-helpers'
import {
    TABLE,
    type AImporterApprovisionnementColumn,
} from '../types/grist-tables'

export type ApprovisionnementAImporter = ExtractedLine & {
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
        Excel_Ademe: line.read.document,
        Ligne_Excel: line.read.excelRow,
        Fournisseur_valeur_brute: line.read.supplier,
        Ressource_valeur_brute: line.read.resource,
        Tonnage_total: line.read.tonnage,
        Repartition_valeur_brute: line.read.rawProvenance,
        Repartition_calculee_par_le_script: JSON.stringify(
            line.derived.parsedProvenance.distribution.map(
                ({ source, provenance, percentage }) => ({
                    source,
                    provenance,
                    pourcentage: percentage,
                    donnees_additionnelles: line.read.additionalData,
                })
            )
        ),
        Niveau_de_confiance: line.derived.parsedProvenance.confidence,
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
