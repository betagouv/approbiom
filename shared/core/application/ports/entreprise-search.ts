import type { Entreprise } from '@shared/core/domain/entities/entreprise'

export interface EntrepriseSearchPort {
    getEntrepriseFromQuery(query: string): Promise<Entreprise | null>
}
