import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../helpers/grist-helpers'
import { TABLE } from '../types/grist-tables'
import { createGristExtractedApprovisionnementAdapter } from './grist-adapter-extracted-approvisionnement'

const TABLES: Record<string, ColumnMajorTable> = {
    [TABLE.entreprise]: {
        id: [1, 2],
        Siret: ['00000000000001', '00000000000002'],
        Denomination: ['BOIS FICTIF ENERGIE', 'COOPERATIVE FICTIVE DES FORETS'],
    },
    [TABLE.metaRessource]: {
        id: [1, 6],
        Code_ressource_Approbiom: ['1A-PFA', '2A-CIB'],
        ademe_2017: ['2017-1A-PFA', '2017-2A-CIB'],
        Description_courte: ['Plaquettes forestières', 'Ecorces'],
        Description: ['Plaquettes forestières dont souches', 'Ecorces'],
    },
    [TABLE.extractedApprovisionnement]: {
        id: [5],
        Fournisseur: [1],
        Ressource: [1],
    },
}

function mockGrist() {
    const update = vi.fn(() => Promise.resolve())

    vi.stubGlobal('grist', {
        docApi: {
            fetchTable: vi.fn((tableId: string) =>
                Promise.resolve(TABLES[tableId])
            ),
        },
        getTable: () => ({ update }),
        ready: vi.fn(),
        onOptions: (
            handler: (
                options: unknown,
                settings: { accessLevel: string }
            ) => void
        ) => handler({}, { accessLevel: 'full' }),
    })

    return update
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristExtractedApprovisionnementAdapter().update', () => {
    it('points the row at the entreprise with the chosen siret', async () => {
        const update = mockGrist()

        await createGristExtractedApprovisionnementAdapter().update(5, {
            matchedFournisseur: {
                denomination: 'COOPERATIVE FICTIVE DES FORETS',
                siret: '00000000000002',
            },
        })

        expect(update).toHaveBeenCalledWith({
            id: 5,
            fields: { Fournisseur: 2 },
        })
    })

    it('points the row at the ressource with the chosen code', async () => {
        const update = mockGrist()

        await createGristExtractedApprovisionnementAdapter().update(5, {
            matchedRessource: {
                code: '2A-CIB',
                ademeCode: '2017-2A-CIB',
                title: 'Ecorces',
                description: 'Ecorces',
            },
        })

        expect(update).toHaveBeenCalledWith({
            id: 5,
            fields: { Ressource: 6 },
        })
    })

    it('empties the reference when nothing is chosen', async () => {
        const update = mockGrist()

        await createGristExtractedApprovisionnementAdapter().update(5, {
            matchedFournisseur: null,
        })

        expect(update).toHaveBeenCalledWith({
            id: 5,
            fields: { Fournisseur: 0 },
        })
    })
})
