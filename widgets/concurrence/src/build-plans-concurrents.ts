import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/value-objects/ressource'
import { getProvenanceLabel } from '@shared/core/domain/value-objects/provenance'
import type { ConcurrenceRow, PlanConcurrence } from './load-concurrence'

/** True when the approvisionnement matches the Provenance and Fournisseur filters. */
export type GetIsApprovisionnementRetenu = (
    approvisionnement: Approvisionnement
) => boolean

export const FOURNISSEUR_NON_RENSEIGNE = 'Non renseigné'

export type RessourceConcurrente = {
    nom: Ressource['title']
    code: Ressource['code']
    famille: Ressource['famille']
    provenances: { retenues: string[]; nonRetenues: string[] }
    fournisseurs: { retenus: string[]; nonRetenus: string[] }
    tonnageRetenu: number
    tonnageTotal: number
}

export type PlanConcurrent = {
    plan: PlanConcurrence
    ressources: RessourceConcurrente[]
}

const byProvenance = (a: string, b: string) =>
    a.localeCompare(b, 'fr', { numeric: true })

const compareNoms = (a: string, b: string) =>
    Number(a === '') - Number(b === '') ||
    a.localeCompare(b, 'fr', { numeric: true })

/** By installation, then type de plan; what has no name comes last. */
const byInstallation = (a: PlanConcurrent, b: PlanConcurrent) =>
    compareNoms(a.plan.installationNom, b.plan.installationNom) ||
    compareNoms(a.plan.typeDePlan, b.plan.typeDePlan)

const byFournisseur = (a: string, b: string) =>
    Number(a === FOURNISSEUR_NON_RENSEIGNE) -
        Number(b === FOURNISSEUR_NON_RENSEIGNE) || a.localeCompare(b, 'fr')

/** Splits the labels between those of at least one retenu and the others. */
function splitRetenus(
    approvisionnements: readonly Approvisionnement[],
    getIsApprovisionnementRetenu: GetIsApprovisionnementRetenu,
    labelOf: (approvisionnement: Approvisionnement) => string,
    compare: (a: string, b: string) => number
): { retenus: string[]; nonRetenus: string[] } {
    const retenus = new Set(
        approvisionnements.filter(getIsApprovisionnementRetenu).map(labelOf)
    )
    const nonRetenus = new Set(
        approvisionnements.map(labelOf).filter((label) => !retenus.has(label))
    )

    return {
        retenus: [...retenus].toSorted(compare),
        nonRetenus: [...nonRetenus].toSorted(compare),
    }
}

/**
 * Groups the (plan, ressource) rows by plan, keeping only the plans with at
 * least one approvisionnement retenu, and all of their ressources. Plans are
 * sorted by installation name.
 */
export function buildPlansConcurrents(
    approvisionnementsByPlanAndRessource: readonly ConcurrenceRow[],
    getIsApprovisionnementRetenu: GetIsApprovisionnementRetenu,
    denominationBySiret: ReadonlyMap<Entreprise['siret'], string>
): PlanConcurrent[] {
    const fournisseurLabel = ({ fournisseur }: Approvisionnement) =>
        fournisseur === undefined
            ? FOURNISSEUR_NON_RENSEIGNE
            : denominationBySiret.get(fournisseur) || fournisseur

    const rowsByPlan = new Map<PlanConcurrence['id'], ConcurrenceRow[]>()
    for (const row of approvisionnementsByPlanAndRessource) {
        const rows = rowsByPlan.get(row.plan.id) ?? []
        rows.push(row)
        rowsByPlan.set(row.plan.id, rows)
    }

    return [...rowsByPlan.values()]
        .filter((rows) =>
            rows.some((row) =>
                row.approvisionnements.some(getIsApprovisionnementRetenu)
            )
        )
        .map((rows) => ({
            plan: rows[0].plan,
            ressources: rows.map((row) => {
                const provenances = splitRetenus(
                    row.approvisionnements,
                    getIsApprovisionnementRetenu,
                    ({ provenance }) => getProvenanceLabel(provenance),
                    byProvenance
                )

                return {
                    nom: row.ressource,
                    code: row.ressourceCode,
                    famille: row.ressourceFamille,
                    provenances: {
                        retenues: provenances.retenus,
                        nonRetenues: provenances.nonRetenus,
                    },
                    fournisseurs: splitRetenus(
                        row.approvisionnements,
                        getIsApprovisionnementRetenu,
                        fournisseurLabel,
                        byFournisseur
                    ),
                    tonnageRetenu: row.approvisionnements
                        .filter(getIsApprovisionnementRetenu)
                        .reduce(
                            (sum, { tonnageTotal }) => sum + tonnageTotal,
                            0
                        ),
                    tonnageTotal: row.tonnageTotal,
                }
            }),
        }))
        .toSorted(byInstallation)
}
