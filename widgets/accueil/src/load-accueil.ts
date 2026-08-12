import type { PlanQuery } from '@shared/application/ports/plan-query'
import type { Plan } from '@shared/application/read-models/plan'

export type AccueilPorts = {
    plans: PlanQuery
}

export type AccueilScreen = {
    plansApprovisionnement: readonly Plan[]
}

export async function loadAccueil(ports: AccueilPorts): Promise<AccueilScreen> {
    return { plansApprovisionnement: await ports.plans.list() }
}
