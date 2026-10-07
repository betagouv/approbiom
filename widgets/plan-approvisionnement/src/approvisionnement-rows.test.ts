import { describe, expect, it } from 'vitest'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'
import {
    toApprovisionnementRows,
    type Referentiels,
} from './approvisionnement-rows'

const REFERENTIELS: Referentiels = {
    entreprises: [
        { siret: '00000000000001', denomination: 'BOIS FICTIF ENERGIE' },
        { siret: '00000000000002', denomination: 'COOPERATIVE FICTIVE' },
    ],
    ressources: [
        {
            code: '1A-PFA',
            ademeCode: '2017-1A-PFA',
            title: 'Plaquettes forestières',
            description: 'Plaquettes forestières dont souches et rémanents',
        },
        {
            code: '2B-CIB',
            ademeCode: '2017-2B-CIB',
            title: 'Connexes de scierie',
            description: 'Produits connexes de scierie hors écorces',
        },
    ],
    departementsByRegion: [
        {
            region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
            departements: [
                { dep: '19', libelle: 'Corrèze' },
                { dep: '87', libelle: 'Haute-Vienne' },
            ],
        },
    ],
}

const departement = (code: string): Provenance => ({
    source: DEPARTEMENT_FRANCAIS,
    code,
})

let nextId = 1
function approvisionnement(
    fournisseur: string | undefined,
    ressource: string,
    provenance: Provenance,
    tonnageTotal = 100
): Approvisionnement {
    return {
        id: nextId++,
        planDApprovisionnement: 1,
        fournisseur,
        ressource,
        provenance,
        tonnageTotal,
    }
}

const rowsOf = (approvisionnements: readonly Approvisionnement[]) =>
    toApprovisionnementRows(approvisionnements, REFERENTIELS)

describe('toApprovisionnementRows', () => {
    it('names the fournisseur, the ressource and the provenance', () => {
        const [row] = rowsOf([
            approvisionnement(
                '00000000000001',
                '1A-PFA',
                departement('19'),
                2400
            ),
        ])

        expect(row).toMatchObject({
            fournisseur: 'BOIS FICTIF ENERGIE',
            ressource: '1A-PFA · Plaquettes forestières',
            provenance: 'Corrèze (19)',
            tonnage: 2400,
            duplicate: null,
        })
    })

    it('names a foreign provenance by its country', () => {
        const [row] = rowsOf([
            approvisionnement('00000000000001', '1A-PFA', {
                source: PAYS_ETRANGER,
                libelle: 'Espagne',
            }),
        ])

        expect(row.provenance).toBe('Espagne')
    })

    it('gives no name to a fournisseur the plan leaves out', () => {
        const [row] = rowsOf([
            approvisionnement(undefined, '1A-PFA', departement('19')),
        ])

        expect(row.fournisseur).toBeNull()
    })

    // A value missing from the referentiels still says something.
    it('falls back on the raw value for what the referentiels lack', () => {
        const [row] = rowsOf([
            approvisionnement('99999999999999', 'XX', departement('2A')),
        ])

        expect(row).toMatchObject({
            fournisseur: '99999999999999',
            ressource: 'XX',
            provenance: '2A',
        })
    })

    it('sorts by ressource, then provenance, then fournisseur', () => {
        const rows = rowsOf([
            approvisionnement('00000000000002', '2B-CIB', departement('19')),
            approvisionnement('00000000000002', '1A-PFA', departement('87')),
            approvisionnement('00000000000002', '1A-PFA', departement('19')),
            approvisionnement('00000000000001', '1A-PFA', departement('19')),
        ])

        expect(
            rows.map(({ ressource, provenance, fournisseur }) =>
                [ressource.slice(0, 6), provenance, fournisseur].join(' ')
            )
        ).toEqual([
            '1A-PFA Corrèze (19) BOIS FICTIF ENERGIE',
            '1A-PFA Corrèze (19) COOPERATIVE FICTIVE',
            '1A-PFA Haute-Vienne (87) COOPERATIVE FICTIVE',
            '2B-CIB Corrèze (19) COOPERATIVE FICTIVE',
        ])
    })

    it('letters the duplicates by group, in the order they appear', () => {
        const rows = rowsOf([
            approvisionnement('00000000000002', '2B-CIB', departement('19'), 1),
            approvisionnement('00000000000001', '1A-PFA', departement('19'), 2),
            approvisionnement('00000000000002', '2B-CIB', departement('19'), 3),
            approvisionnement('00000000000001', '1A-PFA', departement('19'), 4),
            approvisionnement('00000000000001', '1A-PFA', departement('87'), 5),
        ])

        expect(
            rows.map(({ tonnage, duplicate }) => [tonnage, duplicate])
        ).toEqual([
            [2, 'A'],
            [4, 'A'],
            [5, null],
            [1, 'B'],
            [3, 'B'],
        ])
    })

    it('counts two rows without fournisseur as duplicates', () => {
        const rows = rowsOf([
            approvisionnement(undefined, '1A-PFA', departement('19')),
            approvisionnement(undefined, '1A-PFA', departement('19')),
        ])

        expect(rows.map(({ duplicate }) => duplicate)).toEqual(['A', 'A'])
    })

    it('tells a département from a country of the same name', () => {
        const rows = rowsOf([
            approvisionnement(undefined, '1A-PFA', departement('Espagne')),
            approvisionnement(undefined, '1A-PFA', {
                source: PAYS_ETRANGER,
                libelle: 'Espagne',
            }),
        ])

        expect(rows.map(({ duplicate }) => duplicate)).toEqual([null, null])
    })

    it('goes on with AA once Z is used', () => {
        const ressources = Array.from({ length: 27 }, (_, index) => `R${index}`)
        const rows = rowsOf(
            ressources.flatMap((ressource) => [
                approvisionnement(undefined, ressource, departement('19')),
                approvisionnement(undefined, ressource, departement('19')),
            ])
        )

        expect(rows.at(-1)?.duplicate).toBe('AA')
    })
})
