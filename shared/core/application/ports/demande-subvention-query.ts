import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'

export interface DemandeSubventionQuery {
    list(): Promise<readonly DemandeSubvention[]>
}
