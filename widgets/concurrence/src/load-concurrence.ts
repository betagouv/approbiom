import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { InstallationPort } from '@shared/core/application/ports/installation'
import type {
    DepartementsByRegion,
    ReferentielGeoPort,
} from '@shared/core/application/ports/referentiel-geo'
import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { RessourcesPort } from '@shared/core/application/ports/ressources'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    codeDepartementOf,
    type Commune,
} from '@shared/core/domain/value-objects/commune'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Installation } from '@shared/core/domain/entities/installation'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Ressource } from '@shared/core/domain/value-objects/ressource'

export type ConcurrencePorts = {
    approvisionnements: ApprovisionnementPort
    plans: PlanPort
    installations: InstallationPort
    ressources: RessourcesPort
    entreprises: EntreprisePort
    referentielGeo: Pick<
        ReferentielGeoPort,
        | 'listDepartementsByRegion'
        | 'getCommuneCenterPosition'
        | 'getDepartementContour'
        | 'getCountryContour'
    >
}

export type PlanConcurrence = {
    id: PlanDApprovisionnement['id']
    /** The plan's own name repeats its installation, type and statut. */
    installationNom: Installation['nom']
    typeDePlan: PlanDApprovisionnement['typeDePlan']
    departementDeSituation: Departement['libelle']
    installationCommune: Commune['codeInsee'] | null
    statut: PlanDApprovisionnement['statut']
}

/**
 * A (plan, ressource) total, with its approvisionnements kept for filtering by
 * provenance and fournisseur.
 */
export type ConcurrenceRow = {
    plan: PlanConcurrence
    ressource: Ressource['title']
    ressourceCode: Ressource['code']
    ressourceFamille: Ressource['famille']
    approvisionnements: readonly Approvisionnement[]
    tonnageTotal: number
}

export type ConcurrenceScreen = {
    approvisionnementsByPlanAndRessource: readonly ConcurrenceRow[]
    departementsByRegion: readonly DepartementsByRegion[]
    fournisseurs: readonly Entreprise[]
}

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
        ports.approvisionnements.listGroupedByPlanAndRessource(),
        ports.approvisionnements.list(),
        ports.plans.list(),
        ports.installations.list(),
        ports.ressources.list(['code', 'title', 'famille']),
        ports.entreprises.list(),
        ports.referentielGeo.listDepartementsByRegion(),
    ])

    const planById = new Map(plans.map((plan) => [plan.id, plan]))
    const installationById = new Map(
        installations.map((installation) => [installation.id, installation])
    )
    const ressourceByCode = new Map(ressources.map((r) => [r.code, r]))

    const libelleByDep = new Map(
        departementsByRegion.flatMap(({ departements }) =>
            departements.map((d) => [d.dep, d.libelle] as const)
        )
    )

    const getPlanConcurrence = (
        id: PlanDApprovisionnement['id'],
        plan: PlanDApprovisionnement | undefined
    ): PlanConcurrence => {
        const installation = plan && installationById.get(plan.installation)
        const commune = installation?.commune || null
        const dep = commune === null ? undefined : codeDepartementOf(commune)

        return {
            id,
            installationNom: installation?.nom ?? '',
            typeDePlan: plan?.typeDePlan ?? '',
            departementDeSituation: dep ? (libelleByDep.get(dep) ?? dep) : '',
            installationCommune: commune,
            statut: plan?.statut ?? '',
        }
    }

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
            const ressource = ressourceByCode.get(total.ressource)

            return {
                plan: getPlanConcurrence(
                    total.planDApprovisionnement,
                    planById.get(total.planDApprovisionnement)
                ),
                ressource: ressource?.title ?? total.ressource,
                ressourceCode: total.ressource,
                ressourceFamille: ressource?.famille ?? '',
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
