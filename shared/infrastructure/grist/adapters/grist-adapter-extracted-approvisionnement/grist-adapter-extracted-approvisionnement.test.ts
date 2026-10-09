import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../../types/grist-tables'
import { createGristExtractedApprovisionnementAdapter } from './grist-adapter-extracted-approvisionnement'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'

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

    it('stores the distribution as JSON', async () => {
        const update = mockGrist()
        const parsedProvenance = {
            distribution: [
                {
                    source: 'Département français' as const,
                    provenance: '19',
                    percentage: 25,
                },
            ],
            confidence: 'Explicite' as const,
            unrecognized: [],
        }

        await createGristExtractedApprovisionnementAdapter().update(5, {
            parsedProvenance,
        })

        expect(update).toHaveBeenCalledWith({
            id: 5,
            fields: {
                Repartition_par_provenance: JSON.stringify(parsedProvenance),
            },
        })
    })
})

describe('createGristExtractedApprovisionnementAdapter().update, controle', () => {
    it('writes the controle', async () => {
        const update = mockGrist()

        await createGristExtractedApprovisionnementAdapter().update(5, {
            controle: VERIFIEE,
        })

        expect(update).toHaveBeenCalledWith({
            id: 5,
            fields: { Controle: VERIFIEE },
        })
    })

    it('writes the controle along with a change', async () => {
        const update = mockGrist()

        await createGristExtractedApprovisionnementAdapter().update(5, {
            matchedFournisseur: null,
            controle: NON_VERIFIEE,
        })

        expect(update).toHaveBeenCalledWith({
            id: 5,
            fields: { Fournisseur: 0, Controle: NON_VERIFIEE },
        })
    })
})

describe('createGristExtractedApprovisionnementAdapter().deleteByDocument', () => {
    function mockDocuments() {
        const destroy = vi.fn(() => Promise.resolve())
        const tables: Record<string, ColumnMajorTable> = {
            [TABLE.attachment]: {
                id: [4, 6],
                Plan_d_approvisionnement: [160, 160],
                piece_jointe: [
                    ['L', 20],
                    ['L', 21],
                ],
                type: ['excel ademe', 'excel ademe'],
            },
            [TABLE.extractedApprovisionnement]: Object.fromEntries(
                COLUMNS.extractedApprovisionnement.map((column) => [
                    column,
                    column === 'id'
                        ? [1, 2, 3]
                        : column === 'Document'
                          ? [4, 6, 4]
                          : ['', '', ''],
                ])
            ),
        }

        vi.stubGlobal('grist', {
            docApi: {
                fetchTable: vi.fn((tableId: string) =>
                    Promise.resolve(tables[tableId])
                ),
            },
            getTable: () => ({ destroy }),
            ready: vi.fn(),
            onOptions: (
                handler: (
                    options: unknown,
                    settings: { accessLevel: string }
                ) => void
            ) => handler({}, { accessLevel: 'full' }),
        })

        return destroy
    }

    it('deletes the lines of that document only', async () => {
        const destroy = mockDocuments()

        await createGristExtractedApprovisionnementAdapter().deleteByDocument({
            id: 20,
        })

        expect(destroy).toHaveBeenCalledWith([1, 3])
    })

    it('deletes nothing for a document never extracted', async () => {
        const destroy = mockDocuments()

        await createGristExtractedApprovisionnementAdapter().deleteByDocument({
            id: 99,
        })

        expect(destroy).not.toHaveBeenCalled()
    })
})

describe('createGristExtractedApprovisionnementAdapter().deleteLines', () => {
    it('deletes the lines imported', async () => {
        const destroy = vi.fn(() => Promise.resolve())
        vi.stubGlobal('grist', {
            getTable: () => ({ destroy }),
            ready: vi.fn(),
            onOptions: (
                handler: (
                    options: unknown,
                    settings: { accessLevel: string }
                ) => void
            ) => handler({}, { accessLevel: 'full' }),
        })

        await createGristExtractedApprovisionnementAdapter().deleteLines([1, 3])

        expect(destroy).toHaveBeenCalledWith([1, 3])
    })
})

describe('createGristExtractedApprovisionnementAdapter().listSummaries', () => {
    function mockSummaries() {
        const tables: Record<string, ColumnMajorTable> = {
            [TABLE.attachment]: {
                id: [4, 6],
                Plan_d_approvisionnement: [160, 220],
                piece_jointe: [
                    ['L', 20],
                    ['L', 21],
                ],
                type: ['excel ademe', 'excel ademe'],
            },
            [TABLE.extractedApprovisionnement]: {
                id: [1, 2, 3],
                Document: [4, 4, 4],
                Date_d_extraction: [1790587200, 1790587200, 1790587200],
                Controle: [VERIFIEE, NON_VERIFIEE, null],
                ...Object.fromEntries(
                    COLUMNS.extractedApprovisionnement
                        .filter(
                            (column) =>
                                ![
                                    'id',
                                    'Document',
                                    'Date_d_extraction',
                                    'Controle',
                                ].includes(column)
                        )
                        .map((column) => [column, ['', '', '']])
                ),
            },
        }

        vi.stubGlobal('grist', {
            docApi: {
                fetchTable: vi.fn((tableId: string) =>
                    Promise.resolve(tables[tableId])
                ),
            },
            ready: vi.fn(),
            onOptions: (
                handler: (
                    options: unknown,
                    settings: { accessLevel: string }
                ) => void
            ) => handler({}, { accessLevel: 'full' }),
        })
    }

    it('summarises an extracted document', async () => {
        mockSummaries()

        const summaries =
            await createGristExtractedApprovisionnementAdapter().listSummaries()

        expect(
            summaries.find(({ attachmentId }) => attachmentId === 20)
        ).toEqual({
            attachmentId: 20,
            extractedAt: new Date(1790587200 * 1000),
            lineCount: 3,
            verifiedCount: 1,
        })
    })

    it('has no extraction date for a document never extracted', async () => {
        mockSummaries()

        const summaries =
            await createGristExtractedApprovisionnementAdapter().listSummaries()

        expect(
            summaries.find(({ attachmentId }) => attachmentId === 21)
        ).toEqual({
            attachmentId: 21,
            extractedAt: null,
            lineCount: 0,
            verifiedCount: 0,
        })
    })
})
