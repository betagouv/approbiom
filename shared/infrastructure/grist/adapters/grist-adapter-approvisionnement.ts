import type {
    ApprovisionnementGroupedByPlanAndRessource,
    ApprovisionnementPort,
} from '@shared/core/application/ports/approvisionnement'
import { gristReady } from '../helpers/grist-ready'
import {
    asIdList,
    asNumber,
    asString,
    byRowId,
    createRows,
    fetchRowsOnce,
    lookup,
    type GristRow,
} from '../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../types/grist-tables'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'

const asText = (value: unknown): string =>
    typeof value === 'number' ? String(value) : asString(value)

function fournisseurSiret(
    index: Map<number, GristRow>,
    ref: unknown
): string | undefined {
    // Grist answers 0 for a Ref pointing at nothing: in Approvisionnement,
    // `Fournisseur: 0` is an approvisionnement without fournisseur.
    if (ref === 0) return undefined

    const siret = asText(lookup(index, ref)?.Siret)

    return siret === '' ? undefined : siret
}

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

const PAYS_DE_PROVENANCE = 'Pays_de_provenance'
const FRANCE = 'France'

// The countries are the choices of the Pays_de_provenance column, kept in its
// widget options.
async function readPaysDeProvenanceColumn(): Promise<{
    widgetOptions: Record<string, unknown>
    choices: string[]
}> {
    await gristReady()

    const [tables, columns] = await Promise.all([
        fetchRowsOnce('_grist_Tables', ['id', 'tableId']),
        fetchRowsOnce('_grist_Tables_column', [
            'parentId',
            'colId',
            'widgetOptions',
        ]),
    ])
    const tableRef = tables.find(
        (table) => table.tableId === TABLE.approvisionnement
    )?.id
    const column = columns.find(
        (column) =>
            column.parentId === tableRef && column.colId === PAYS_DE_PROVENANCE
    )
    const widgetOptions = JSON.parse(
        asString(column?.widgetOptions) || '{}'
    ) as Record<string, unknown>
    const { choices } = widgetOptions

    return {
        widgetOptions,
        choices: (Array.isArray(choices) ? choices : []).filter(
            (choice): choice is string => typeof choice === 'string'
        ),
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
                fournisseur: fournisseurSiret(entrepriseById, row.Fournisseur),
                tonnageTotal: asNumber(row.Total_en_tMv_an_) ?? 0,
            }))
        },

        async create(approvisionnements) {
            await gristReady()

            const [entreprises, ressources, departements, attachments] =
                await Promise.all([
                    fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise),
                    fetchRowsOnce(TABLE.metaRessource, COLUMNS.metaRessource),
                    fetchRowsOnce(TABLE.departement, COLUMNS.departement),
                    fetchRowsOnce(TABLE.attachment, COLUMNS.attachment),
                ])

            // A Ref pointing at nothing is written 0.
            const idOf = (
                rows: readonly GristRow[],
                matches: (row: GristRow) => boolean
            ) => asNumber(rows.find(matches)?.id) ?? 0

            await createRows(
                TABLE.approvisionnement,
                approvisionnements.map((approvisionnement) => {
                    const { provenance, source } = approvisionnement

                    return {
                        Plan_d_approvisionnement:
                            approvisionnement.planDApprovisionnement,
                        Fournisseur: idOf(
                            entreprises,
                            (row) =>
                                asText(row.Siret) ===
                                approvisionnement.fournisseur
                        ),
                        Ressource: idOf(
                            ressources,
                            (row) =>
                                asString(row.Code_ressource_Approbiom) ===
                                approvisionnement.ressource
                        ),
                        Departement_de_provenance:
                            provenance.source === DEPARTEMENT_FRANCAIS
                                ? idOf(
                                      departements,
                                      (row) =>
                                          asString(row.DEP) === provenance.code
                                  )
                                : 0,
                        Pays_de_provenance:
                            provenance.source === PAYS_ETRANGER
                                ? provenance.libelle
                                : FRANCE,
                        Total_en_tMv_an_: approvisionnement.tonnageTotal,
                        Donnees_additionnelles_provenant_du_document:
                            approvisionnement.additionalDataFromDocument ?? '',
                        Source:
                            source === undefined
                                ? 0
                                : idOf(attachments, (row) =>
                                      asIdList(row.piece_jointe).includes(
                                          source
                                      )
                                  ),
                    }
                })
            )
        },

        async listPaysDeProvenance() {
            const { choices } = await readPaysDeProvenanceColumn()

            return choices
                .filter((choice) => choice !== FRANCE)
                .map((libelle) => ({ libelle }))
        },

        async addPaysDeProvenance({ libelle }) {
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
            // code, or a country's libellé — and needs no directory either.
            return rows.map((row) => ({
                ...toGroup(row, ressources),
                provenance: asText(row.Provenance),
            }))
        },
    }
}
