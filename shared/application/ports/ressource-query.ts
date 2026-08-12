import type { Ressource } from '@shared/domain/ressource'

/** The ressource directory: turns the code an aggregate carries into a title. */
export interface RessourceQuery {
    list(): Promise<readonly Ressource[]>
}
