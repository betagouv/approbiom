import type { Entreprise } from '@shared/core/domain/entities/entreprise'

export type FoundEntreprise = Pick<Entreprise, 'siret' | 'denomination'>

export interface EntrepriseSearchPort {
    // Empty when nothing matches the query.
    getEntrepriseFromQuery(query: string): Promise<FoundEntreprise[]>
}
