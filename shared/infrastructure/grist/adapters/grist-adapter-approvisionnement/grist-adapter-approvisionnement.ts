import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import { gristReady } from '../../helpers/grist-ready'
import {
    asNumber,
    asString,
    byRowId,
    createRows,
    deleteRows,
    fetchRowsOnce,
    updateRow,
} from '../../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../../types/grist-tables'
import {
    asText,
    FRANCE,
    fournisseurSiret,
    PAYS_DE_PROVENANCE,
    readPaysDeProvenanceColumn,
    readReferencedTables,
    ressourceCode,
    toCells,
    toGroup,
    toProvenance,
} from './utils'

export function createGristApprovisionnementPort(): ApprovisionnementPort {
    /** Every summary needs Meta_Ressource to resolve its Ref. */
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
                id: asNumber(row.id) ?? 0,
                planDApprovisionnement:
                    asNumber(row.Plan_d_approvisionnement) ?? 0,
                ressource: ressourceCode(ressourceById, row.Ressource),
                provenance: toProvenance(row, departementById),
                fournisseur: fournisseurSiret(entrepriseById, row.Fournisseur),
                tonnageTotal: asNumber(row.Total_en_tMv_an_) ?? 0,
            }))
        },

        async create(approvisionnements) {
            await gristReady()

            const referencedTables = await readReferencedTables()

            // A new row fills every column, whatever was left out.
            return createRows(
                TABLE.approvisionnement,
                approvisionnements.map((approvisionnement) =>
                    toCells(
                        {
                            fournisseur: undefined,
                            additionalDataFromDocument: undefined,
                            source: undefined,
                            ...approvisionnement,
                        },
                        referencedTables
                    )
                )
            )
        },

        async update(id, approvisionnement) {
            await gristReady()

            await updateRow(
                TABLE.approvisionnement,
                id,
                toCells(approvisionnement, await readReferencedTables())
            )
        },

        async delete(id) {
            await gristReady()

            await deleteRows(TABLE.approvisionnement, [id])
        },

        async listPaysDeProvenance() {
            await gristReady()

            const { choices } = await readPaysDeProvenanceColumn()

            return choices
                .filter((choice) => choice !== FRANCE)
                .map((libelle) => ({ libelle }))
        },

        async addPaysDeProvenance({ libelle }) {
            await gristReady()

            const { widgetOptions, choices } =
                await readPaysDeProvenanceColumn()

            await grist.docApi.applyUserActions([
                [
                    'ModifyColumn',
                    TABLE.approvisionnement,
                    PAYS_DE_PROVENANCE,
                    {
                        widgetOptions: JSON.stringify({
                            ...widgetOptions,
                            choices: [...choices, libelle],
                        }),
                    },
                ],
            ])
        },

        async listGroupedByPlanAndRessource() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByPlanAndRessource,
                COLUMNS.totalByPlanAndRessource
            )

            return rows.map((row) => toGroup(row, ressources))
        },

        async listGroupedByPlanRessourceAndRegionOuPays() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByRegionOuPays,
                COLUMNS.totalByRegionOuPays
            )

            return rows.map((row) => ({
                ...toGroup(row, ressources),
                regionOuPays: asString(row.Region_francaise_ou_Pays_etranger),
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
                fournisseur: fournisseurSiret(entrepriseById, row.Fournisseur),
            }))
        },

        async listGroupedByPlanRessourceAndProvenance() {
            const { rows, ressources } = await readTotals(
                TABLE.totalByProvenance,
                COLUMNS.totalByProvenance
            )

            // The same text column the entity is built from, so the summary
            // names a provenance exactly the way `list` does — a département
            // code, or a country's libellé — and needs no referenced table either.
            return rows.map((row) => ({
                ...toGroup(row, ressources),
                provenance: asText(row.Provenance),
            }))
        },
    }
}
