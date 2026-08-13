import type { Departement } from '@shared/application/domain/departement'
import type { Installation } from '@shared/application/domain/installation'
import type { Region } from '@shared/application/domain/region'
import type { DepartementsByRegion } from './departements-by-region'
import type { Plan } from './plan'

export type PlanAccueil = Plan & {
    departement: Departement['dep'] | null
    installationRegion: Region['libelle'] | null
}

export function getPlansAccueil(
    plans: readonly Plan[],
    installations: readonly Installation[],
    departementsByRegion: readonly DepartementsByRegion[]
): PlanAccueil[] {
    const installationById = new Map(
        installations.map((installation) => [installation.id, installation])
    )

    const regionByDepartement = new Map<Departement['dep'], Region['libelle']>()
    for (const { region, departements } of departementsByRegion)
        for (const departement of departements)
            regionByDepartement.set(departement.dep, region.libelle)

    return plans.map((plan) => {
        const departement =
            installationById.get(plan.installation)?.commune.dep || null

        return {
            ...plan,
            departement,
            installationRegion:
                departement === null
                    ? null
                    : (regionByDepartement.get(departement) ?? null),
        }
    })
}
