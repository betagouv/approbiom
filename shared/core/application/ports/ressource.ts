import type { Ressource } from '@shared/core/domain/value-objects/ressource'

export interface RessourcePort {
    list(): Promise<readonly Ressource[]>
}
