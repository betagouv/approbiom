import type { Ressource } from '@shared/core/domain/entities/ressource'

export interface RessourcePort {
    list(): Promise<readonly Ressource[]>
}
