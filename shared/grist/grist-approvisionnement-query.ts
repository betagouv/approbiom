import type { ApprovisionnementQuery } from '@shared/core/application/ports/approvisionnement'
import type { ApprovisionnementByPlanAndRessource } from '@shared/core/application/ports/approvisionnement'
import { gristReady } from './grist-ready'
import {
    asNumber,
    asString,
    byRowId,
    fetchRowsOnce,
    lookup,
    type GristRow,
} from './grist-helpers'
import { COLUMNS, TABLE } from './grist-tables'

/**
 * Reads a cell that holds a number but means text. `Siret` is stored numeric in
 * the document while it identifies an entreprise, so it crosses into the domain
 * as the string it is.
 */
const asText = (value: unknown): string =>
    typeof value === 'number' ? String(value) : asString(value)

/** A Ref to `Meta_Ressource`, read as the code the ressource is keyed by. */
const ressourceCode = (index: Map<number, GristRow>, ref: unknown): string =>
    asString(lookup(index, ref)?.Code_ressource_Approbiom)

/** The fields every summary carries, whichever dimension it adds to them. */
function toTotal(
    row: GristRow,
    ressources: Map<number, GristRow>
): ApprovisionnementByPlanAndRessource {
    return {
        planDApprovisionnement: asNumber(row.Plan_d_approvisionnement) ?? 0,
        ressource: ressourceCode(ressources, row.Ressource),
        sumTonnageTotal: asNumber(row.Total_en_tMv_an_),
        repartition: asNumber(row.Repartition),
    }
}

export function createGristApprovisionnementQuery(): ApprovisionnementQuery {
    /** Every summary needs the ressource directory to resolve its Ref. */
    const readTotals = async (tableId: string, columns: readonly string[]) => {
        await gristReady()

        const [rows, ressources] = await Promise.all([
            fetchRowsOnce(tableId, columns),
            fetchRowsOnce(TABLE.metaRessource, COLUMNS.metaRessource),
        ])

        return { rows, ressources: byRowId(ressources) }
    }

    return {
        async listApprovisionnements() {
            await gristReady()

            const [rows, ressources, entreprises, departements] =
                await Promise.all([
                    fetchRowsOnce(
                        TABLE.approvisionnement,
                        COLUMNS.approvisionnement
                    ),
                    fetchRowsOnce(TABLE.metaRessource, COLUMNS.metaRessource),
                    fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise),
                    fetchRowsOnce(TABLE.departement, COLUMNS.departement),
                ])

            const ressourceById = byRowId(ressources)
            const entrepriseById = byRowId(entreprises)
            const departementById = byRowId(departements)

            return rows.map((row) => ({
                planDApprovisionnement:
                    asNumber(row.Plan_d_approvisionnement) ?? 0,
                ressource: ressourceCode(ressourceById, row.Ressource),
                departementDeProvenance: asString(
                    lookup(departementById, row.Departement_de_provenance)?.DEP
                ),
                fournisseur: asText(
                    lookup(entrepriseById, row.Fournisseur)?.Siret
                ),
                tonnageTotal: asNumber(row.Total_en_tMv_an_) ?? 0,
            }))
        },

        async listByPlanAndRessource() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByPlanAndRessource,
                COLUMNS.totalByPlanAndRessource
            )

            return rows.map((row) => toTotal(row, ressources))
        },

        async listByPlanRessourceAndRegion() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByRegion,
                COLUMNS.totalByRegion
            )

            // `Region` is a formula, not a Ref: it already reads as a libellé,
            // so there is no code to resolve against a directory.
            return rows.map((row) => ({
                ...toTotal(row, ressources),
                region: asString(row.Region),
            }))
        },

        async listByPlanRessourceAndFournisseur() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByFournisseur,
                COLUMNS.totalByFournisseur
            )
            const entrepriseById = byRowId(
                await fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise)
            )

            return rows.map((row) => ({
                ...toTotal(row, ressources),
                fournisseur: asText(
                    lookup(entrepriseById, row.Fournisseur)?.Siret
                ),
            }))
        },

        async listByPlanRessourceAndDepartementDeProvenance() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByDepartementDeProvenance,
                COLUMNS.totalByDepartementDeProvenance
            )
            const departementById = byRowId(
                await fetchRowsOnce(TABLE.departement, COLUMNS.departement)
            )

            return rows.map((row) => ({
                ...toTotal(row, ressources),
                departementDeProvenance: asString(
                    lookup(departementById, row.Departement_de_provenance)?.DEP
                ),
            }))
        },
    }
}
