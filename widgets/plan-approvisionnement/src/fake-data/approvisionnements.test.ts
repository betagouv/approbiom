import { describe, expect, it } from 'vitest'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import { createFakeApprovisionnementPort } from './approvisionnements'

const STORED: Approvisionnement = {
    id: 4,
    planDApprovisionnement: 1,
    fournisseur: '00000000000002',
    ressource: '1A-PFA',
    provenance: { source: DEPARTEMENT_FRANCAIS, code: '19' },
    tonnageTotal: 2400,
}

describe('createFakeApprovisionnementPort', () => {
    it('gives a created approvisionnement the next id', async () => {
        const port = createFakeApprovisionnementPort([STORED])
        await port.create([
            {
                planDApprovisionnement: 1,
                ressource: '2B-CIB',
                provenance: { source: DEPARTEMENT_FRANCAIS, code: '87' },
                tonnageTotal: 300,
            },
        ])

        expect((await port.list()).map(({ id }) => id)).toEqual([4, 5])
    })

    it('writes the fields given over the approvisionnement', async () => {
        const port = createFakeApprovisionnementPort([STORED])

        await port.update(4, {
            fournisseur: '00000000000003',
            ressource: '2B-CIB',
            provenance: { source: DEPARTEMENT_FRANCAIS, code: '87' },
            tonnageTotal: 300,
        })

        expect(await port.list()).toEqual([
            {
                id: 4,
                planDApprovisionnement: 1,
                fournisseur: '00000000000003',
                ressource: '2B-CIB',
                provenance: { source: DEPARTEMENT_FRANCAIS, code: '87' },
                tonnageTotal: 300,
            },
        ])
    })

    it('leaves the fields not given as they are', async () => {
        const port = createFakeApprovisionnementPort([STORED])

        await port.update(4, { tonnageTotal: 300 })

        expect(await port.list()).toEqual([{ ...STORED, tonnageTotal: 300 }])
    })

    it('clears a fournisseur given as undefined', async () => {
        const port = createFakeApprovisionnementPort([STORED])

        await port.update(4, { fournisseur: undefined })

        expect((await port.list())[0].fournisseur).toBeUndefined()
    })

    it('deletes the approvisionnement', async () => {
        const port = createFakeApprovisionnementPort([STORED])

        await port.delete(4)

        expect(await port.list()).toEqual([])
    })

    it('rejects an id it does not hold', async () => {
        const port = createFakeApprovisionnementPort([STORED])

        await expect(port.delete(9)).rejects.toThrow(
            'No fake approvisionnement 9.'
        )
    })
})
