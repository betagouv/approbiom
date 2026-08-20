import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'

export interface DemandeSubventionPort {
    list(): Promise<readonly DemandeSubvention[]>
}
