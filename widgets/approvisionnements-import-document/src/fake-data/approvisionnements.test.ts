import { describe, expect, it } from 'vitest'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import { createFakeApprovisionnementPort } from './approvisionnements'

const APPROVISIONNEMENT = {
    planDApprovisionnement: 1,
    ressource: '2B-CIB',
    provenance: { source: DEPARTEMENT_FRANCAIS, code: '87' },
    tonnageTotal: 300,
} as const

describe('createFakeApprovisionnementPort', () => {
    it('gives each created approvisionnement the next id', async () => {
        const port = createFakeApprovisionnementPort([])

        expect(
            await port.create([APPROVISIONNEMENT, APPROVISIONNEMENT])
        ).toEqual([1, 2])
        expect(await port.create([APPROVISIONNEMENT])).toEqual([3])
        expect((await port.list()).map(({ id }) => id)).toEqual([1, 2, 3])
    })

    it('lists a pays once it is added', async () => {
        const port = createFakeApprovisionnementPort()

        await port.addPaysDeProvenance({ libelle: 'Belgique' })

        expect(await port.listPaysDeProvenance()).toContainEqual({
            libelle: 'Belgique',
        })
    })
})
