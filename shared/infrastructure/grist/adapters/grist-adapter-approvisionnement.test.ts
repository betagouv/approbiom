import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'
import type { ColumnMajorTable } from '../grist-helpers'
import { TABLE } from '../grist-tables'
import { createGristApprovisionnementPort } from './grist-adapter-approvisionnement'

/** The directories every approvisionnement resolves its Refs against. */
const DIRECTORIES: Record<string, ColumnMajorTable> = {
    [TABLE.metaRessource]: {
        id: [1],
        Code_ressource_Approbiom: ['PF'],
        Description_courte: ['Plaquettes forestières'],
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
}

// The adapter reads `grist.docApi.fetchTable` and `grist.ready`, both installed
// by the Grist plugin script, which does not exist under jsdom.
function mockGrist(approvisionnements: ColumnMajorTable) {
    const tables: Record<string, ColumnMajorTable> = {
        ...DIRECTORIES,
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
})
