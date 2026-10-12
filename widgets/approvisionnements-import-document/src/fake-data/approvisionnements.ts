import type { Ports } from '../ports'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'

const IMPORTED_FROM_ANNEXE: readonly Approvisionnement[] = [
    {
        id: 1,
        planDApprovisionnement: 1,
        fournisseur: '00000000000002',
        ressource: '1A-PFA',
        provenance: { source: DEPARTEMENT_FRANCAIS, code: '19' },
        tonnageTotal: 1200,
        source: 103,
    },
    {
        id: 2,
        planDApprovisionnement: 1,
        fournisseur: '00000000000002',
        ressource: '1A-PFA',
        provenance: { source: DEPARTEMENT_FRANCAIS, code: '23' },
        tonnageTotal: 800,
        source: 103,
    },
]

export function createFakeApprovisionnementPort(
    initial: readonly Approvisionnement[] = IMPORTED_FROM_ANNEXE
): Ports['approvisionnements'] {
    let rows = [...initial]
    let nextId = Math.max(0, ...rows.map(({ id }) => id)) + 1
    const paysDeProvenance: Pays[] = [
        { libelle: 'Espagne' },
        { libelle: 'Italie' },
        { libelle: 'Allemagne' },
    ]

    return {
        list: () => Promise.resolve([...rows]),
        create: (approvisionnements) => {
            const created = approvisionnements.map((approvisionnement) => ({
                ...approvisionnement,
                id: nextId++,
            }))
            rows = [...rows, ...created]
            return Promise.resolve(created.map(({ id }) => id))
        },
        listPaysDeProvenance: () => Promise.resolve([...paysDeProvenance]),
        addPaysDeProvenance: (created) => {
            paysDeProvenance.push(created)
            return Promise.resolve()
        },
    }
}
