import type { Ressource } from '@shared/core/domain/value-objects/ressource'

export interface RessourcesPort {
    list<Property extends keyof Ressource>(
        properties: readonly Property[]
    ): Promise<readonly Pick<Ressource, Property>[]>
}
