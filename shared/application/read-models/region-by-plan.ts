import type { Installation } from '@shared/application/domain/installation'
import type { Region } from '@shared/application/domain/region'
import type { DepartementsByRegion } from './departements-by-region'
import type { Plan } from './plan'

export function getRegionByPlan(
    plans: readonly Plan[],
    installations: readonly Installation[],
    departementsByRegion: readonly DepartementsByRegion[]
): ReadonlyMap<Plan['id'], Region['libelle']> {
    const installationById = new Map(
        installations.map((installation) => [installation.id, installation])
    )

    const regionByDepartement = new Map<string, Region['libelle']>()
    for (const { region, departements } of departementsByRegion) {
        for (const departement of departements) {
            regionByDepartement.set(departement.dep, region.libelle)
        }
    }

    const regionByPlan = new Map<Plan['id'], Region['libelle']>()

    for (const plan of plans) {
        const installation = installationById.get(plan.installation)
        if (installation === undefined) continue

        // A commune with no `DEP` reads as the empty string, which matches no
        // département — so the blank case needs no test of its own here.
        const region = regionByDepartement.get(installation.commune.dep)
        if (region === undefined) continue

        regionByPlan.set(plan.id, region)
    }

    return regionByPlan
}
