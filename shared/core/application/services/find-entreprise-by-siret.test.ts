import { describe, expect, it } from 'vitest'
import type { FoundEntreprise } from '@shared/core/application/ports/entreprise-search'
import { findEntrepriseBySiret } from './find-entreprise-by-siret'

const SIRET = '00000000000042'

const found = (siret: string, denomination: string): FoundEntreprise => ({
    siret,
    denomination,
    etatAdministratif: { etat: 'en-activite' },
    adresse: '1 RUE FICTIVE 00000 COMMUNE-FICTIVE',
})

describe('findEntrepriseBySiret', () => {
    it('finds the establishment carrying the SIRET', async () => {
        const result = await findEntrepriseBySiret(SIRET, () =>
            Promise.resolve([
                found('00000000000001', 'AUTRE FICTIVE'),
                found(SIRET, 'SCIERIE FICTIVE'),
            ])
        )

        expect(result).toEqual({
            status: 'found',
            denomination: 'SCIERIE FICTIVE',
        })
    })

    it('finds nothing when no answer carries the SIRET', async () => {
        const result = await findEntrepriseBySiret(SIRET, () =>
            Promise.resolve([found('00000000000001', 'AUTRE FICTIVE')])
        )

        expect(result).toEqual({ status: 'notfound' })
    })

    it('fails when the service fails', async () => {
        await expect(
            findEntrepriseBySiret(SIRET, () => Promise.reject(new Error('503')))
        ).rejects.toThrow('503')
    })

    it('fails when the service is too slow', async () => {
        await expect(
            findEntrepriseBySiret(SIRET, () => new Promise(() => {}), 10)
        ).rejects.toThrow('trop de temps')
    })
})
