import type { Entreprise } from '@shared/core/domain/entities/entreprise'

export interface EntrepriseQuery {
    list(): Promise<readonly Entreprise[]>
}
