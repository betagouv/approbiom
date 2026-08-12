import type { Plan } from '@shared/application/read-models/plan'
import {
    loadRessource,
    type RessourcePorts,
    type RessourceScreen,
} from '@shared/screens/ressource'

export type AccueilPorts = RessourcePorts

export type AccueilScreen = {
    plansApprovisionnement: readonly Plan[]
    ressource: RessourceScreen
}

export async function loadAccueil(ports: AccueilPorts): Promise<AccueilScreen> {
    const [plansApprovisionnement, ressource] = await Promise.all([
        ports.plans.list(),
        loadRessource(ports),
    ])

    return { plansApprovisionnement, ressource }
}
