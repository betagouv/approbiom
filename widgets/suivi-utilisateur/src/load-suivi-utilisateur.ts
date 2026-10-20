import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { UtilisateurPort } from '@shared/core/application/ports/utilisateur'
import { suivreCreations, type SuiviCreations } from './suivi-creations'

export type SuiviUtilisateurPorts = {
    plans: Pick<PlanPort, 'list'>
    utilisateurs: Pick<UtilisateurPort, 'list'>
}

export async function loadSuiviUtilisateur(
    ports: SuiviUtilisateurPorts
): Promise<SuiviCreations> {
    const [creations, comptes] = await Promise.all([
        ports.plans.list(['createdBy', 'createdAt']),
        ports.utilisateurs.list(),
    ])

    return suivreCreations(creations, comptes, new Date())
}
