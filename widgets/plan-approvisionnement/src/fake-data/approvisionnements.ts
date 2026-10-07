import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'

const departement = (code: string): Provenance => ({
    source: DEPARTEMENT_FRANCAIS,
    code,
})
const pays = (libelle: string): Provenance => ({
    source: PAYS_ETRANGER,
    libelle,
})

// Plan, fournisseur (SIRET), ressource, provenance, tonnage. Plan 1 holds two
// pairs of duplicates, one of them without fournisseur; plans 3 and 10 are
// empty.
const SEED: readonly (readonly [
    number,
    string | undefined,
    string,
    Provenance,
    number,
])[] = [
    [7, '00000000000001', '1A-PFA', departement('19'), 1600],
    [7, '00000000000001', '1A-PFA', departement('23'), 960],
    [7, '00000000000009', '2B-CIB', departement('87'), 420],
    [7, undefined, '4A-GR', pays('Espagne'), 300],
    [7, '00000000000003', '2B-CIB', departement('19'), 950],
    [4, '00000000000007', '1A-PFA', departement('15'), 1200],
    [4, '00000000000008', '1B-PFA', departement('87'), 380],
    [4, '00000000000002', '1A-PFA', departement('19'), 900],
    [1, '00000000000002', '1A-PFA', departement('19'), 2400],
    [1, '00000000000002', '1A-PFA', departement('23'), 1100],
    [1, '00000000000006', '2A-CIB', departement('87'), 350],
    [1, undefined, '1B-PFA', departement('24'), 280],
    [1, '00000000000002', '1A-PFA', departement('19'), 1800],
    [1, undefined, '1B-PFA', departement('24'), 150],
    [2, '00000000000007', '1A-PFA', departement('19'), 3000],
    [2, '00000000000007', '1A-PFA', departement('15'), 1500],
    [2, '00000000000003', '2B-CIB', departement('19'), 800],
    [2, '00000000000004', '4A-GR', pays('Allemagne'), 450],
    [5, '00000000000004', '4A-GR', departement('63'), 5200],
    [5, '00000000000004', '4A-GR', pays('Espagne'), 1300],
    [5, '00000000000009', '2B-CIB', departement('19'), 2100],
    [6, '00000000000001', '1A-PFA', departement('87'), 4100],
    [6, '00000000000005', '1D-BR', departement('86'), 600],
    [8, '00000000000007', '1A-PFA', departement('15'), 2800],
    [8, '00000000000008', '1B-PFA', departement('15'), 700],
    [8, undefined, '1D-BR', departement('63'), 450],
    [9, '00000000000003', '2B-CIB', departement('87'), 6200],
    [9, '00000000000006', '2A-CIB', departement('86'), 1800],
    [9, '00000000000001', '1A-PFA', departement('24'), 2600],
    [9, '00000000000004', '4A-GR', pays('Italie'), 900],
    [11, '00000000000002', '1A-PFA', departement('23'), 1900],
    [11, '00000000000008', '1B-PFA', departement('23'), 520],
    [12, '00000000000005', '1D-BR', departement('63'), 1400],
]

export const FAKE_APPROVISIONNEMENTS: readonly Approvisionnement[] = SEED.map(
    (
        [
            planDApprovisionnement,
            fournisseur,
            ressource,
            provenance,
            tonnageTotal,
        ],
        index
    ) => ({
        id: index + 1,
        planDApprovisionnement,
        fournisseur,
        ressource,
        provenance,
        tonnageTotal,
    })
)

// Stands in for the Approvisionnement table, in memory: it lasts as long as
// the page.
export function createFakeApprovisionnementPort(
    initial: readonly Approvisionnement[] = FAKE_APPROVISIONNEMENTS
): ApprovisionnementPort {
    let rows = [...initial]
    let nextId = Math.max(0, ...rows.map(({ id }) => id)) + 1
    const paysDeProvenance: Pays[] = [
        { libelle: 'Espagne' },
        { libelle: 'Italie' },
        { libelle: 'Allemagne' },
    ]

    const missing = (id: number) =>
        Promise.reject(new Error(`No fake approvisionnement ${id}.`))

    return {
        list: () => Promise.resolve([...rows]),
        create: (approvisionnements) => {
            rows = [
                ...rows,
                ...approvisionnements.map((approvisionnement) => ({
                    ...approvisionnement,
                    id: nextId++,
                })),
            ]
            return Promise.resolve()
        },
        update: (id, approvisionnement) => {
            if (!rows.some((row) => row.id === id)) return missing(id)

            rows = rows.map((row) =>
                row.id === id ? { ...row, ...approvisionnement } : row
            )
            return Promise.resolve()
        },
        delete: (id) => {
            if (!rows.some((row) => row.id === id)) return missing(id)

            rows = rows.filter((row) => row.id !== id)
            return Promise.resolve()
        },
        listPaysDeProvenance: () => Promise.resolve([...paysDeProvenance]),
        addPaysDeProvenance: (created) => {
            paysDeProvenance.push(created)
            return Promise.resolve()
        },
        listGroupedByPlanAndRessource: () => Promise.resolve([]),
        listGroupedByPlanRessourceAndRegionOuPays: () => Promise.resolve([]),
        listGroupedByPlanRessourceAndProvenance: () => Promise.resolve([]),
        listGroupedByPlanRessourceAndFournisseur: () => Promise.resolve([]),
    }
}
