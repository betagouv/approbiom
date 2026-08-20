import type { Entreprise } from '@shared/core/domain/entities/entreprise'

export interface EntreprisePort {
    list(): Promise<readonly Entreprise[]>
}
