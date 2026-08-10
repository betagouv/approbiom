import type { ApprovisionnementQuery } from '@shared/application/ports/approvisionnement-query'
import type { ApprovisionnementByPlanAndRessource } from '@shared/application/read-models/approvisionnement-by-plan-and-ressource'
import { fetchRows } from '@shared/grist/api/client'
import { gristReady } from './grist-ready'
import { asNumber, asString, byColumn, byRowId, lookup } from './grist-helpers'

const GRIST_TABLE_ID_ROW_BY_PLAN_AND_RESSOURCE =
    'Approvisionnement_summary_Plan_d_approvisionnement_Ressource'
// The nested list comes from the raw table rather than a summary: no summary
// carries both the département de provenance and the fournisseur — Grist groups
// by one or the other — and one row here is exactly one `Approvisionnement`.
const GRIST_TABLE_ID_APPROVISIONNEMENT = 'Approvisionnement'
const GRIST_TABLE_ID_ENTREPRISE = 'Entreprise'
const GRIST_TABLE_ID_META_RESSOURCE = 'Meta_Ressource'
const GRIST_TABLE_ID_PLAN_D_APPROVISIONNEMENT = 'Plan_d_approvisionnement'
const GRIST_TABLE_ID_INSTALLATION = 'Installation'
const GRIST_TABLE_ID_INSEE_COMMUNE = 'INSEE_Commune'
const GRIST_TABLE_ID_INSEE_DEPARTEMENT = 'INSEE_Departement'

type RequestedApprovisionnement =
    ApprovisionnementByPlanAndRessource['approvisionnements'][number]

/** The pair both summaries are grouped by, as a Map key. */
const pairKey = (plan: unknown, ressource: unknown) =>
    `${String(plan)}:${String(ressource)}`

export function createGristApprovisionnementQuery(): ApprovisionnementQuery {
    return {
        async listByPlanAndRessource() {
            await gristReady()

            const [
                totals,
                approvisionnements,
                plans,
                ressources,
                installations,
                communes,
                departements,
                entreprises,
            ] = await Promise.all([
                fetchRows(GRIST_TABLE_ID_ROW_BY_PLAN_AND_RESSOURCE, [
                    'Plan_d_approvisionnement',
                    'Ressource',
                    'Total_en_tMv_an_',
                ]),
                fetchRows(GRIST_TABLE_ID_APPROVISIONNEMENT, [
                    'Plan_d_approvisionnement',
                    'Ressource',
                    'Departement_de_provenance',
                    'Fournisseur',
                    'Total_en_tMv_an_',
                ]),
                fetchRows(GRIST_TABLE_ID_PLAN_D_APPROVISIONNEMENT, [
                    'id',
                    'Nom',
                    'Installation',
                ]),
                fetchRows(GRIST_TABLE_ID_META_RESSOURCE, [
                    'id',
                    'Description_courte',
                ]),
                fetchRows(GRIST_TABLE_ID_INSTALLATION, ['id', 'Commune']),
                fetchRows(GRIST_TABLE_ID_INSEE_COMMUNE, ['id', 'DEP']),
                fetchRows(GRIST_TABLE_ID_INSEE_DEPARTEMENT, [
                    'id',
                    'DEP',
                    'LIBELLE',
                ]),
                // Suppliers live in `Entreprise`; the `Fournisseur` column kept
                // its own name when the table was renamed.
                fetchRows(GRIST_TABLE_ID_ENTREPRISE, ['id', 'Denomination']),
            ])

            const planById = byRowId(plans)
            const ressourceById = byRowId(ressources)
            const installationById = byRowId(installations)
            const communeById = byRowId(communes)

            // Départements are joined two ways: by rowId for the provenance Ref,
            // by code for the situation, which the commune carries as text.
            const departementById = byRowId(departements)
            const departementByCode = byColumn(departements, 'DEP')
            const entrepriseById = byRowId(entreprises)

            const approvisionnementsByPair = new Map<
                string,
                RequestedApprovisionnement[]
            >()
            for (const approvisionnement of approvisionnements) {
                const key = pairKey(
                    approvisionnement.Plan_d_approvisionnement,
                    approvisionnement.Ressource
                )
                const group = approvisionnementsByPair.get(key) ?? []
                group.push({
                    departementDeProvenance: asString(
                        lookup(
                            departementById,
                            approvisionnement.Departement_de_provenance
                        )?.DEP
                    ),
                    fournisseur: asString(
                        lookup(entrepriseById, approvisionnement.Fournisseur)
                            ?.Denomination
                    ),
                    tonnageTotal:
                        asNumber(approvisionnement.Total_en_tMv_an_) ?? 0,
                })
                approvisionnementsByPair.set(key, group)
            }

            return totals.map((total) => {
                const plan = lookup(planById, total.Plan_d_approvisionnement)
                const installation = lookup(
                    installationById,
                    plan?.Installation
                )
                const commune = lookup(communeById, installation?.Commune)
                const departement = departementByCode.get(
                    asString(commune?.DEP)
                )

                return {
                    planDApprovisionnement: asString(plan?.Nom),
                    ressource: asString(
                        lookup(ressourceById, total.Ressource)
                            ?.Description_courte
                    ),
                    departementDeSituation: asString(departement?.LIBELLE),
                    approvisionnements:
                        approvisionnementsByPair.get(
                            pairKey(
                                total.Plan_d_approvisionnement,
                                total.Ressource
                            )
                        ) ?? [],
                    sumTonnageTotal: asNumber(total.Total_en_tMv_an_),
                }
            })
        },
    }
}
