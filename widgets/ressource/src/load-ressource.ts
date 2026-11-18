import type { InstallationPort } from '@shared/core/application/ports/installation'
import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { Installation } from '@shared/core/domain/entities/installation'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'

export type RessourcePorts = {
    plans: Pick<PlanPort, 'list'>
    installations: Pick<InstallationPort, 'list'>
}

export type RessourceScreen = {
    plans: readonly PlanDApprovisionnement[]
    installations: readonly Installation[]
}

export async function loadRessource(
    ports: RessourcePorts
): Promise<RessourceScreen> {
    const [plans, installations] = await Promise.all([
        ports.plans.list(),
        ports.installations.list(),
    ])

    return { plans, installations }
}
