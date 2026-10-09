import { describe, expect, it } from 'vitest'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'
import {
    duplicateKey,
    duplicatedKeys,
    type Approvisionnement,
} from './approvisionnement'

const approvisionnement = (
    id: number,
    changes: Partial<Approvisionnement> = {}
): Approvisionnement => ({
    id,
    planDApprovisionnement: 1,
    fournisseur: '00000000000001',
    ressource: '1A-PFA',
    provenance: { source: DEPARTEMENT_FRANCAIS, code: '19' },
    tonnageTotal: 100,
    ...changes,
})

describe('duplicatedKeys', () => {
    it('finds two approvisionnements with the same fournisseur, ressource and provenance', () => {
        const first = approvisionnement(1)

        expect(
            duplicatedKeys([first, approvisionnement(2, { tonnageTotal: 50 })])
        ).toEqual(new Set([duplicateKey(first)]))
    })

    it('finds none when the fournisseur differs', () => {
        expect(
            duplicatedKeys([
                approvisionnement(1),
                approvisionnement(2, { fournisseur: '00000000000002' }),
            ]).size
        ).toBe(0)
    })

    it('counts two approvisionnements without fournisseur as duplicates', () => {
        expect(
            duplicatedKeys([
                approvisionnement(1, { fournisseur: undefined }),
                approvisionnement(2, { fournisseur: undefined }),
            ]).size
        ).toBe(1)
    })

    it('tells a département from a country of the same name', () => {
        expect(
            duplicatedKeys([
                approvisionnement(1, {
                    provenance: { source: DEPARTEMENT_FRANCAIS, code: 'Gabon' },
                }),
                approvisionnement(2, {
                    provenance: { source: PAYS_ETRANGER, libelle: 'Gabon' },
                }),
            ]).size
        ).toBe(0)
    })
})
