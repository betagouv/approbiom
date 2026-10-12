import { describe, expect, it } from 'vitest'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import { countImportedApprovisionnementsByDocument } from './count-imported-approvisionnements'

const approvisionnement = (
    id: number,
    source?: Approvisionnement['source']
): Approvisionnement => ({
    id,
    planDApprovisionnement: 1,
    ressource: '1A-PFA',
    provenance: { source: DEPARTEMENT_FRANCAIS, code: '19' },
    tonnageTotal: 100,
    source,
})

describe('countImportedApprovisionnementsByDocument', () => {
    it('counts the approvisionnements of each source document, and leaves out those entered by hand', async () => {
        const counts = await countImportedApprovisionnementsByDocument({
            approvisionnements: {
                list: () =>
                    Promise.resolve([
                        approvisionnement(1, 341),
                        approvisionnement(2, 341),
                        approvisionnement(3, 342),
                        approvisionnement(4),
                    ]),
            },
        })

        expect(counts).toEqual(
            new Map([
                [341, 2],
                [342, 1],
            ])
        )
    })
})
