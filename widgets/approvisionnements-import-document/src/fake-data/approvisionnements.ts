import type { Ports } from '../ports'
import type { Pays } from '@shared/core/domain/value-objects/pays'

export function createFakeApprovisionnementPort(): Ports['approvisionnements'] {
    let nextId = 1
    const paysDeProvenance: Pays[] = [
        { libelle: 'Espagne' },
        { libelle: 'Italie' },
        { libelle: 'Allemagne' },
    ]

    return {
        create: (approvisionnements) =>
            Promise.resolve(approvisionnements.map(() => nextId++)),
        listPaysDeProvenance: () => Promise.resolve([...paysDeProvenance]),
        addPaysDeProvenance: (created) => {
            paysDeProvenance.push(created)
            return Promise.resolve()
        },
    }
}
