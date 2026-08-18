import type { Ressource } from '@shared/core/domain/entities/ressource'

/** The ressource directory: turns the code an aggregate carries into a title. */
export interface RessourceQuery {
    list(): Promise<readonly Ressource[]>
}
