import type {
    ApprovisionnementGroupedByPlanAndRessource,
    ApprovisionnementPort,
} from '@shared/core/application/ports/approvisionnement'
import { gristReady } from '../grist-ready'
import {
    asNumber,
    asString,
    byRowId,
    fetchRowsOnce,
    lookup,
    type GristRow,
} from '../grist-helpers'
import { COLUMNS, TABLE } from '../grist-tables'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'

const asText = (value: unknown): string =>
    typeof value === 'number' ? String(value) : asString(value)

const ressourceCode = (index: Map<number, GristRow>, ref: unknown): string =>
    asString(lookup(index, ref)?.Code_ressource_Approbiom)

function toProvenance(
    row: GristRow,
    departements: Map<number, GristRow>
): Provenance {
    const departement = lookup(departements, row.Departement_de_provenance)

    if (departement !== undefined) {
        return { source: DEPARTEMENT_FRANCAIS, code: asString(departement.DEP) }
    }

    const libelle = asText(row.Provenance)

    return libelle === ''
        ? { source: DEPARTEMENT_FRANCAIS, code: '' }
        : { source: PAYS_ETRANGER, libelle }
}

/**
 * The fields every summary carries, whichever dimension it adds to them.
 *
 * A cell the document cannot answer for reads as zero here rather than crossing
 * the port unknown: left open, every screen would invent its own fallback and
 * they would not agree.
 */
function toGroup(
    row: GristRow,
    ressources: Map<number, GristRow>
): ApprovisionnementGroupedByPlanAndRessource {
    return {
        planDApprovisionnement: asNumber(row.Plan_d_approvisionnement) ?? 0,
        ressource: ressourceCode(ressources, row.Ressource),
        tonnageTotal: asNumber(row.Total_en_tMv_an_) ?? 0,
        repartition: asNumber(row.Repartition) ?? 0,
    }
}

export function createGristApprovisionnementPort(): ApprovisionnementPort {
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
        async list() {
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
                provenance: toProvenance(row, departementById),
                fournisseur: asText(
                    lookup(entrepriseById, row.Fournisseur)?.Siret
                ),
                tonnageTotal: asNumber(row.Total_en_tMv_an_) ?? 0,
            }))
        },

        async listGroupedByPlanAndRessource() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByPlanAndRessource,
                COLUMNS.totalByPlanAndRessource
            )

            return rows.map((row) => toGroup(row, ressources))
        },

        async listGroupedByPlanRessourceAndRegion() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByRegion,
                COLUMNS.totalByRegion
            )

            // `Region` is a formula, not a Ref: it already reads as a libellé,
            // so there is no code to resolve against a directory.
            return rows.map((row) => ({
                ...toGroup(row, ressources),
                region: asString(row.Region),
            }))
        },

        async listGroupedByPlanRessourceAndFournisseur() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByFournisseur,
                COLUMNS.totalByFournisseur
            )
            const entrepriseById = byRowId(
                await fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise)
            )

            return rows.map((row) => ({
                ...toGroup(row, ressources),
                fournisseur: asText(
                    lookup(entrepriseById, row.Fournisseur)?.Siret
                ),
            }))
        },

        async listGroupedByPlanRessourceAndDepartement() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByDepartementDeProvenance,
                COLUMNS.totalByDepartementDeProvenance
            )
            const departementById = byRowId(
                await fetchRowsOnce(TABLE.departement, COLUMNS.departement)
            )

            return rows.map((row) => ({
                ...toGroup(row, ressources),
                departement: asString(
                    lookup(departementById, row.Departement_de_provenance)?.DEP
                ),
            }))
        },
    }
}
