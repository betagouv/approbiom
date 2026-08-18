import type { ApprovisionnementQuery } from '@shared/core/application/ports/approvisionnement'
import type { EntrepriseQuery } from '@shared/core/application/ports/entreprise'
import type { InseeQuery } from '@shared/core/application/ports/insee'
import type { InstallationQuery } from '@shared/core/application/ports/installation'
import type { PlanQuery } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { RessourceQuery } from '@shared/core/application/ports/ressource'
import type { DepartementsByRegion } from '@shared/core/application/ports/insee'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Ressource } from '@shared/core/domain/entities/ressource'

export type ConcurrencePorts = {
    approvisionnements: ApprovisionnementQuery
    plans: PlanQuery
    installations: InstallationQuery
    ressources: RessourceQuery
    entreprises: EntrepriseQuery
    insee: InseeQuery
}

/**
 * One line of the concurrence table: a (plan, ressource) total with everything
 * it is read by already resolved, and the approvisionnements behind it kept so
 * the screen can narrow on département and fournisseur at once.
 */
export type ConcurrenceRow = {
    planDApprovisionnement: PlanDApprovisionnement['nom']
    ressource: Ressource['title']
    departementDeSituation: Departement['libelle']
    approvisionnements: readonly Approvisionnement[]
    sumTonnageTotal?: number
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
        installations,
        ressources,
        fournisseurs,
        departementsByRegion,
    ] = await Promise.all([
        ports.approvisionnements.listByPlanAndRessource(),
        ports.approvisionnements.listApprovisionnements(),
        ports.plans.list(),
        ports.installations.list(),
        ports.ressources.list(),
        ports.entreprises.list(),
        ports.insee.listDepartementsByRegion(),
    ])

    const installationById = new Map(installations.map((i) => [i.id, i]))
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
            // Where a plan sits is a property of its installation's commune.
            const dep = plan
                ? installationById.get(plan.installation)?.commune.dep
                : undefined

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
                sumTonnageTotal: total.sumTonnageTotal,
            }
        }),
        departementsByRegion,
        fournisseurs,
    }
}
