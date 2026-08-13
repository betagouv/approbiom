import type { ApprovisionnementQuery } from '@shared/application/ports/approvisionnement-query'
import type { EntrepriseQuery } from '@shared/application/ports/entreprise-query'
import type { InseeQuery } from '@shared/application/ports/insee-query'
import type { PlanQuery } from '@shared/application/ports/plan-query'
import type { RessourceQuery } from '@shared/application/ports/ressource-query'
import type { ApprovisionnementByPlanAndRessource } from '@shared/application/read-models/approvisionnement-by-plan-and-ressource'
import type { ApprovisionnementByPlanRessourceAndDepartementDeProvenance } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-departement-de-provenance'
import type { ApprovisionnementByPlanRessourceAndFournisseur } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-fournisseur'
import type { ApprovisionnementByPlanRessourceAndRegion } from '@shared/application/read-models/approvisionnement-by-plan-ressource-and-region'
import type { PlanDApprovisionnement as Plan } from '@shared/application/domain/plan-d-approvisionnement'

export type RessourcePorts = {
    approvisionnements: ApprovisionnementQuery
    plans: PlanQuery
    ressources: RessourceQuery
    entreprises: EntrepriseQuery
    insee: InseeQuery
}

/**
 * The four aggregates this screen reads, plus the directories that name what
 * they reference. The aggregates carry codes and sirets; the maps are what turn
 * those into something a reader recognises, and they are built once here rather
 * than on every render.
 */
export type RessourceScreen = {
    plans: readonly Plan[]
    totals: readonly ApprovisionnementByPlanAndRessource[]
    byRegion: readonly ApprovisionnementByPlanRessourceAndRegion[]
    byFournisseur: readonly ApprovisionnementByPlanRessourceAndFournisseur[]
    byDepartementDeProvenance: readonly ApprovisionnementByPlanRessourceAndDepartementDeProvenance[]
    ressourceTitles: ReadonlyMap<string, string>
    fournisseurNames: ReadonlyMap<string, string>
    departementNames: ReadonlyMap<string, string>
}

export async function loadRessource(
    ports: RessourcePorts
): Promise<RessourceScreen> {
    const [
        plans,
        totals,
        byRegion,
        byFournisseur,
        byDepartementDeProvenance,
        ressources,
        entreprises,
        departementsByRegion,
    ] = await Promise.all([
        ports.plans.list(),
        ports.approvisionnements.listByPlanAndRessource(),
        ports.approvisionnements.listByPlanRessourceAndRegion(),
        ports.approvisionnements.listByPlanRessourceAndFournisseur(),
        ports.approvisionnements.listByPlanRessourceAndDepartementDeProvenance(),
        ports.ressources.list(),
        ports.entreprises.list(),
        ports.insee.listDepartementsByRegion(),
    ])

    return {
        plans,
        totals,
        byRegion,
        byFournisseur,
        byDepartementDeProvenance,
        ressourceTitles: new Map(ressources.map((r) => [r.code, r.title])),
        fournisseurNames: new Map(
            entreprises.map((e) => [e.siret, e.denomination])
        ),
        departementNames: new Map(
            departementsByRegion.flatMap(({ departements }) =>
                departements.map((d) => [d.dep, d.libelle] as const)
            )
        ),
    }
}
