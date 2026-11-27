import type { Ressource } from '@shared/core/domain/value-objects/ressource'

/** @deprecated Gives an empty famille: use `RessourcesPort.list(properties)`. */
export interface RessourcePort {
    list(): Promise<readonly Ressource[]>
}
