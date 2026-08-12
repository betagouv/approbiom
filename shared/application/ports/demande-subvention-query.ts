import type { DemandeSubvention } from '@shared/application/domain/demande-subvention'

export interface DemandeSubventionQuery {
    list(): Promise<readonly DemandeSubvention[]>
}
