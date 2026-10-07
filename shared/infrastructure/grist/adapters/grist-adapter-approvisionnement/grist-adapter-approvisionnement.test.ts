import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'
import type { ColumnMajorTable } from '../../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../../types/grist-tables'
import { createGristApprovisionnementPort } from './grist-adapter-approvisionnement'

/** The tables the Refs of every approvisionnement point at. */
const REFERENCED_TABLES: Record<string, ColumnMajorTable> = {
    [TABLE.metaRessource]: {
        id: [1],
        Code_ressource_Approbiom: ['PF'],
        ademe_2017: ['2017-1A-PFA'],
        Description_courte: ['Plaquettes forestières'],
        Description: ['Plaquettes forestières dont souches et rémanents'],
    },
    [TABLE.entreprise]: {
        id: [1],
        Siret: ['11111111111111'],
        Denomination: ['Scierie Picard'],
    },
    [TABLE.departement]: {
        id: [1, 2],
        DEP: ['87', '2A'],
        LIBELLE: ['Haute-Vienne', 'Corse-du-Sud'],
        REG: [1, 1],
    },
    [TABLE.attachment]: {
        id: [4],
        Plan_d_approvisionnement: [160],
        piece_jointe: [['L', 20]],
        type: ['excel ademe'],
    },
}

// The adapter reads `grist.docApi.fetchTable` and `grist.ready`, both installed
// by the Grist plugin script, which does not exist under jsdom.
function mockGrist(approvisionnements: ColumnMajorTable) {
    const tables: Record<string, ColumnMajorTable> = {
        ...REFERENCED_TABLES,
        [TABLE.approvisionnement]: approvisionnements,
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

/**
 * One approvisionnement per pair of provenance cells, everything else held
 * still. `0` is how Grist writes a Ref pointing at nothing.
 */
function drawnFrom(
    cells: readonly (readonly [departement: number, provenance: unknown])[]
): ColumnMajorTable {
    return {
        id: cells.map((_, index) => index + 1),
        Plan_d_approvisionnement: cells.map(() => 1),
        Ressource: cells.map(() => 1),
        Departement_de_provenance: cells.map(([departement]) => departement),
        Provenance: cells.map(([, provenance]) => provenance),
        Fournisseur: cells.map(() => 1),
        Total_en_tMv_an_: cells.map(() => 120),
    }
}

const provenancesOf = async () =>
    (await createGristApprovisionnementPort().list()).map(
        ({ provenance }) => provenance
    )

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristApprovisionnementPort', () => {
    it('reads the id of each approvisionnement', async () => {
        mockGrist({
            ...drawnFrom([
                [1, '87'],
                [1, '87'],
            ]),
            id: [12, 30],
        })

        const ids = (await createGristApprovisionnementPort().list()).map(
            ({ id }) => id
        )

        expect(ids).toEqual([12, 30])
    })

    it('reads a fournisseur left empty as undefined', async () => {
        mockGrist({
            ...drawnFrom([
                [1, '87'],
                [1, '87'],
            ]),
            Fournisseur: [1, 0],
        })

        const fournisseurs = (
            await createGristApprovisionnementPort().list()
        ).map(({ fournisseur }) => fournisseur)

        expect(fournisseurs).toEqual(['11111111111111', undefined])
    })

    it('reads a provenance inside France off the département Ref', async () => {
        mockGrist(drawnFrom([[1, '87']]))

        await expect(provenancesOf()).resolves.toEqual([
            { source: DEPARTEMENT_FRANCAIS, code: '87' },
        ])
    })

    // The text column is what carries a country: nothing else in the document
    // names it.
    it('reads a provenance outside France off the text column', async () => {
        mockGrist(drawnFrom([[0, 'Allemagne']]))

        await expect(provenancesOf()).resolves.toEqual([
            { source: PAYS_ETRANGER, libelle: 'Allemagne' },
        ])
    })

    // The same plan may draw one ressource from both sides of the border, so
    // the two live side by side in one read rather than in two.
    it('reads both kinds in a single load', async () => {
        mockGrist(
            drawnFrom([
                [1, '87'],
                [0, 'Allemagne'],
                [2, '2A'],
            ])
        )

        await expect(provenancesOf()).resolves.toEqual([
            { source: DEPARTEMENT_FRANCAIS, code: '87' },
            { source: PAYS_ETRANGER, libelle: 'Allemagne' },
            { source: DEPARTEMENT_FRANCAIS, code: '2A' },
        ])
    })

    // The Ref is the only thing that tells the two apart, so it is what is
    // read — not the text, which cannot say which of the two it holds.
    it('takes the département code from the Ref, not from the text', async () => {
        mockGrist(drawnFrom([[1, 'Allemagne']]))

        await expect(provenancesOf()).resolves.toEqual([
            { source: DEPARTEMENT_FRANCAIS, code: '87' },
        ])
    })

    // A row the document cannot place is a French provenance with no code —
    // the reading it had before a provenance could be foreign — and not a
    // country nobody named.
    it('places a row filling neither cell nowhere, inside France', async () => {
        mockGrist(
            drawnFrom([
                [0, ''],
                [0, null],
            ])
        )

        await expect(provenancesOf()).resolves.toEqual([
            { source: DEPARTEMENT_FRANCAIS, code: '' },
            { source: DEPARTEMENT_FRANCAIS, code: '' },
        ])
    })

    // The column is what the whole notion of provenance now rests on: a rename
    // must fail loudly rather than place every approvisionnement in France.
    it('refuses a document whose approvisionnements have no provenance column', async () => {
        const columns = drawnFrom([[0, 'Allemagne']])
        delete columns.Provenance

        mockGrist(columns)

        await expect(createGristApprovisionnementPort().list()).rejects.toThrow(
            /Provenance/
        )
    })

    describe('the ventilations of the ressource screen', () => {
        /** One summary row per group, everything measured held still. */
        const summarised = (
            column: string,
            groups: readonly string[]
        ): ColumnMajorTable => ({
            Plan_d_approvisionnement: groups.map(() => 1),
            Ressource: groups.map(() => 1),
            Total_en_tMv_an_: groups.map(() => 120),
            Repartition: groups.map(() => 0.5),
            [column]: [...groups],
        })

        function mockSummary(tableId: string, columns: ColumnMajorTable) {
            vi.stubGlobal('grist', {
                docApi: {
                    fetchTable: vi.fn((requested: string) =>
                        Promise.resolve(
                            requested === tableId
                                ? columns
                                : REFERENCED_TABLES[requested]
                        )
                    ),
                },
                ready: vi.fn(),
            })
        }

        // A région and a country arrive in one column, already as libellés.
        it('reads a région and a pays out of the same column', async () => {
            mockSummary(
                TABLE.totalByRegionOuPays,
                summarised(COLUMNS.totalByRegionOuPays[4], [
                    'Nouvelle-Aquitaine',
                    'Allemagne',
                ])
            )

            const groups =
                await createGristApprovisionnementPort().listGroupedByPlanRessourceAndRegionOuPays()

            expect(groups.map((group) => group.regionOuPays)).toEqual([
                'Nouvelle-Aquitaine',
                'Allemagne',
            ])
        })

        // Same reading as `list`: a département by its code, a country by its
        // name, side by side under one dimension.
        it('reads a département and a pays out of the provenance column', async () => {
            mockSummary(
                TABLE.totalByProvenance,
                summarised(COLUMNS.totalByProvenance[4], ['87', 'Allemagne'])
            )

            const groups =
                await createGristApprovisionnementPort().listGroupedByPlanRessourceAndProvenance()

            expect(groups.map((group) => group.provenance)).toEqual([
                '87',
                'Allemagne',
            ])
        })
    })
})

describe('createGristApprovisionnementPort().create', () => {
    function mockGristForCreate() {
        const create = vi.fn(() => Promise.resolve())
        const tables: Record<string, ColumnMajorTable> = {
            ...REFERENCED_TABLES,
            [TABLE.attachment]: {
                id: [4],
                Plan_d_approvisionnement: [160],
                piece_jointe: [['L', 20]],
                type: ['excel ademe'],
            },
        }

        vi.stubGlobal('grist', {
            docApi: {
                fetchTable: vi.fn((tableId: string) =>
                    Promise.resolve(tables[tableId])
                ),
            },
            getTable: () => ({ create }),
            ready: vi.fn(),
            onOptions: (
                handler: (
                    options: unknown,
                    settings: { accessLevel: string }
                ) => void
            ) => handler({}, { accessLevel: 'full' }),
        })

        return create
    }

    it('writes an approvisionnement with its Refs resolved', async () => {
        const create = mockGristForCreate()

        await createGristApprovisionnementPort().create([
            {
                planDApprovisionnement: 160,
                fournisseur: '11111111111111',
                ressource: 'PF',
                provenance: { source: DEPARTEMENT_FRANCAIS, code: '2A' },
                tonnageTotal: 700,
                additionalDataFromDocument: 'PCI: 2,8',
                source: 20,
            },
            {
                planDApprovisionnement: 160,
                fournisseur: '11111111111111',
                ressource: 'PF',
                provenance: { source: PAYS_ETRANGER, libelle: 'Espagne' },
                tonnageTotal: 300,
            },
        ])

        expect(create).toHaveBeenCalledWith([
            {
                fields: {
                    Plan_d_approvisionnement: 160,
                    Fournisseur: 1,
                    Ressource: 1,
                    Departement_de_provenance: 2,
                    Pays_de_provenance: 'France',
                    Total_en_tMv_an_: 700,
                    Donnees_additionnelles_provenant_du_document: 'PCI: 2,8',
                    Source: 4,
                },
            },
            {
                fields: {
                    Plan_d_approvisionnement: 160,
                    Fournisseur: 1,
                    Ressource: 1,
                    Departement_de_provenance: 0,
                    Pays_de_provenance: 'Espagne',
                    Total_en_tMv_an_: 300,
                    Donnees_additionnelles_provenant_du_document: '',
                    Source: 0,
                },
            },
        ])
    })

    it('writes an empty Ref for an approvisionnement without fournisseur', async () => {
        const create = mockGristForCreate()

        await createGristApprovisionnementPort().create([
            {
                planDApprovisionnement: 160,
                ressource: 'PF',
                provenance: { source: DEPARTEMENT_FRANCAIS, code: '87' },
                tonnageTotal: 100,
            },
        ])

        expect(create).toHaveBeenCalledWith([
            {
                fields: {
                    Plan_d_approvisionnement: 160,
                    Fournisseur: 0,
                    Ressource: 1,
                    Departement_de_provenance: 1,
                    Pays_de_provenance: 'France',
                    Total_en_tMv_an_: 100,
                    Donnees_additionnelles_provenant_du_document: '',
                    Source: 0,
                },
            },
        ])
    })
})

describe('createGristApprovisionnementPort().update', () => {
    function mockGristForUpdate() {
        const update = vi.fn(() => Promise.resolve())

        vi.stubGlobal('grist', {
            docApi: {
                fetchTable: vi.fn((tableId: string) =>
                    Promise.resolve(
                        tableId === TABLE.approvisionnement
                            ? { id: [12] }
                            : REFERENCED_TABLES[tableId]
                    )
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

    it('writes the fields given, with their Refs resolved', async () => {
        const update = mockGristForUpdate()

        await createGristApprovisionnementPort().update(12, {
            fournisseur: '11111111111111',
            ressource: 'PF',
            provenance: { source: DEPARTEMENT_FRANCAIS, code: '2A' },
            tonnageTotal: 450,
        })

        expect(update).toHaveBeenCalledWith({
            id: 12,
            fields: {
                Fournisseur: 1,
                Ressource: 1,
                Departement_de_provenance: 2,
                Pays_de_provenance: 'France',
                Total_en_tMv_an_: 450,
            },
        })
    })

    it('leaves the fields not given untouched', async () => {
        const update = mockGristForUpdate()

        await createGristApprovisionnementPort().update(12, {
            tonnageTotal: 450,
        })

        expect(update).toHaveBeenCalledWith({
            id: 12,
            fields: { Total_en_tMv_an_: 450 },
        })
    })

    // Moving abroad must drop the département, or the row would hold both.
    it('clears the département of a provenance moved abroad', async () => {
        const update = mockGristForUpdate()

        await createGristApprovisionnementPort().update(12, {
            provenance: { source: PAYS_ETRANGER, libelle: 'Espagne' },
        })

        expect(update).toHaveBeenCalledWith({
            id: 12,
            fields: {
                Departement_de_provenance: 0,
                Pays_de_provenance: 'Espagne',
            },
        })
    })

    it('clears a fournisseur given as undefined', async () => {
        const update = mockGristForUpdate()

        await createGristApprovisionnementPort().update(12, {
            fournisseur: undefined,
        })

        expect(update).toHaveBeenCalledWith({
            id: 12,
            fields: { Fournisseur: 0 },
        })
    })
    // Written as an empty Ref, it would be lost without anyone noticing.
    it.each([
        ['fournisseur', { fournisseur: '99999999999999' }, /Entreprise/],
        ['ressource', { ressource: 'XX' }, /Meta_Ressource/],
        [
            'département',
            { provenance: { source: DEPARTEMENT_FRANCAIS, code: '99' } },
            /INSEE_Departement/,
        ],
        ['document', { source: 999 }, /Piece_jointe/],
    ] as const)(
        'refuses a %s the document does not hold',
        async (_, approvisionnement, table) => {
            const update = mockGristForUpdate()

            await expect(
                createGristApprovisionnementPort().update(12, approvisionnement)
            ).rejects.toThrow(table)
            expect(update).not.toHaveBeenCalled()
        }
    )

    it('writes a blank département back without a Ref', async () => {
        const update = mockGristForUpdate()

        await createGristApprovisionnementPort().update(12, {
            provenance: { source: DEPARTEMENT_FRANCAIS, code: '' },
        })

        expect(update).toHaveBeenCalledWith({
            id: 12,
            fields: {
                Departement_de_provenance: 0,
                Pays_de_provenance: 'France',
            },
        })
    })
})

describe('createGristApprovisionnementPort().delete', () => {
    it('deletes the row of the approvisionnement', async () => {
        const destroy = vi.fn(() => Promise.resolve())
        vi.stubGlobal('grist', {
            getTable: (tableId: string) => {
                expect(tableId).toBe(TABLE.approvisionnement)
                return { destroy }
            },
            ready: vi.fn(),
            onOptions: (
                handler: (
                    options: unknown,
                    settings: { accessLevel: string }
                ) => void
            ) => handler({}, { accessLevel: 'full' }),
        })

        await createGristApprovisionnementPort().delete(12)

        expect(destroy).toHaveBeenCalledWith([12])
    })
})

describe('createGristApprovisionnementPort().listPaysDeProvenance', () => {
    it('says which column holds options it cannot read', async () => {
        vi.stubGlobal('grist', {
            docApi: {
                fetchTable: vi.fn((tableId: string) =>
                    Promise.resolve(
                        {
                            _grist_Tables: {
                                id: [3],
                                tableId: [TABLE.approvisionnement],
                            },
                            _grist_Tables_column: {
                                parentId: [3],
                                colId: ['Pays_de_provenance'],
                                widgetOptions: ['{not json'],
                            },
                        }[tableId]
                    )
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

        await expect(
            createGristApprovisionnementPort().listPaysDeProvenance()
        ).rejects.toThrow(/Pays_de_provenance/)
    })
})

describe('createGristApprovisionnementPort().addPaysDeProvenance', () => {
    it('adds the country to the choices of Pays_de_provenance', async () => {
        const applyUserActions = vi.fn(() => Promise.resolve())
        const tables: Record<string, ColumnMajorTable> = {
            _grist_Tables: { id: [3], tableId: [TABLE.approvisionnement] },
            _grist_Tables_column: {
                parentId: [3],
                colId: ['Pays_de_provenance'],
                widgetOptions: [
                    JSON.stringify({
                        widget: 'TextBox',
                        choices: ['France', 'Espagne'],
                    }),
                ],
            },
        }
        vi.stubGlobal('grist', {
            docApi: {
                fetchTable: vi.fn((tableId: string) =>
                    Promise.resolve(tables[tableId])
                ),
                applyUserActions,
            },
            ready: vi.fn(),
            onOptions: (
                handler: (
                    options: unknown,
                    settings: { accessLevel: string }
                ) => void
            ) => handler({}, { accessLevel: 'full' }),
        })

        await createGristApprovisionnementPort().addPaysDeProvenance({
            libelle: 'Portugal',
        })

        expect(applyUserActions).toHaveBeenCalledWith([
            [
                'ModifyColumn',
                TABLE.approvisionnement,
                'Pays_de_provenance',
                {
                    widgetOptions: JSON.stringify({
                        widget: 'TextBox',
                        choices: ['France', 'Espagne', 'Portugal'],
                    }),
                },
            ],
        ])
    })
})
