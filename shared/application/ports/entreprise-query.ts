import type { Entreprise } from '@shared/application/domain/entreprise'

export interface EntrepriseQuery {
    list(): Promise<readonly Entreprise[]>
}
