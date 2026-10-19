import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { OptionsPort } from './options'
import { suivreCreations, type SuiviCreations } from './suivi-creations'

export type SuiviUtilisateurPorts = {
    plans: Pick<PlanPort, 'list'>
    options: OptionsPort
}

export type SuiviUtilisateurScreen = {
    suivi: SuiviCreations
    nombreUtilisateurs: number | null
}

export async function loadSuiviUtilisateur(
    ports: SuiviUtilisateurPorts
): Promise<SuiviUtilisateurScreen> {
    const [creations, { nombreUtilisateurs }] = await Promise.all([
        ports.plans.list(['createdBy', 'createdAt']),
        ports.options.read(),
    ])

    return {
        suivi: suivreCreations(creations),
        nombreUtilisateurs,
    }
}
