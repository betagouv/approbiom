import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type {
    DepartementsByRegion,
    LocalizationPort,
} from '@shared/core/application/ports/localization'
import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { RessourcePort } from '@shared/core/application/ports/ressource'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Ressource } from '@shared/core/domain/entities/ressource'

export type ConcurrencePorts = {
    approvisionnements: ApprovisionnementPort
    plans: PlanPort
    ressources: RessourcePort
    entreprises: EntreprisePort
    localization: Pick<LocalizationPort, 'listDepartementsByRegion'>
}

/**
 * One line of the concurrence table: a (plan, ressource) total with everything
 * it is read by already resolved, and the approvisionnements behind it kept so
 * the screen can narrow on provenance and fournisseur at once.
 */
export type ConcurrenceRow = {
    planDApprovisionnement: PlanDApprovisionnement['nom']
    ressource: Ressource['title']
    departementDeSituation: Departement['libelle']
    approvisionnements: readonly Approvisionnement[]
    tonnageTotal: number
}

export type ConcurrenceScreen = {
    approvisionnementsByPlanAndRessource: readonly ConcurrenceRow[]
    departementsByRegion: readonly DepartementsByRegion[]
    fournisseurs: readonly Entreprise[]
}

/** The pair every aggregate is keyed by, as a Map key. */
const pairKey = (plan: number, ressource: string) => `${plan}:${ressource}`

export async function loadConcurrence(
    ports: ConcurrencePorts
): Promise<ConcurrenceScreen> {
    const [
        totals,
        approvisionnements,
        plans,
        ressources,
        fournisseurs,
        departementsByRegion,
    ] = await Promise.all([
        ports.approvisionnements.listGroupedByPlanAndRessource(),
        ports.approvisionnements.list(),
        ports.plans.list(),
        ports.ressources.list(),
        ports.entreprises.list(),
        ports.localization.listDepartementsByRegion(),
    ])

    const planById = new Map(plans.map((plan) => [plan.id, plan]))
    const titleByCode = new Map(ressources.map((r) => [r.code, r.title]))

    // The référentiel doubles as the département directory, so a code coming off
    // a commune can be named without a further read.
    const libelleByDep = new Map(
        departementsByRegion.flatMap(({ departements }) =>
            departements.map((d) => [d.dep, d.libelle] as const)
        )
    )

    const byPair = new Map<string, Approvisionnement[]>()
    for (const approvisionnement of approvisionnements) {
        const key = pairKey(
            approvisionnement.planDApprovisionnement,
            approvisionnement.ressource
        )
        const group = byPair.get(key) ?? []
        group.push(approvisionnement)
        byPair.set(key, group)
    }

    return {
        approvisionnementsByPlanAndRessource: totals.map((total) => {
            const plan = planById.get(total.planDApprovisionnement)
            // Where a plan sits is computed by the document, off the
            // commune of its installation.
            const dep = plan?.departement ?? undefined

            return {
                planDApprovisionnement: plan?.nom ?? '',
                ressource: titleByCode.get(total.ressource) ?? total.ressource,
                departementDeSituation: dep
                    ? (libelleByDep.get(dep) ?? dep)
                    : '',
                approvisionnements:
                    byPair.get(
                        pairKey(total.planDApprovisionnement, total.ressource)
                    ) ?? [],
                tonnageTotal: total.tonnageTotal,
            }
        }),
        departementsByRegion,
        fournisseurs,
    }
}
