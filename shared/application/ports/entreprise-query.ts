import type { Entreprise } from '@shared/domain/entreprise'

export interface EntrepriseQuery {
    list(): Promise<readonly Entreprise[]>
}
