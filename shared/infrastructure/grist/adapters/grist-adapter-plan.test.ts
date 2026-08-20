import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../grist-helpers'
import { createGristPlanPort } from './grist-adapter-plan'

// The adapter reads `grist.docApi.fetchTable` and `grist.ready`, both installed
// by the Grist plugin script, which does not exist under jsdom.
function mockGrist(columns: ColumnMajorTable) {
    const fetchTable = vi.fn().mockResolvedValue(columns)

    vi.stubGlobal('grist', {
        docApi: { fetchTable },
        ready: vi.fn(),
        onOptions: (
            handler: (
                options: unknown,
                settings: { accessLevel: string }
            ) => void
        ) => handler({}, { accessLevel: 'full' }),
    })

    return { fetchTable }
}

/** One plan per `Departement_de_situation` cell, everything else held still. */
function plansPlacedAt(cells: readonly unknown[]): ColumnMajorTable {
    const count = cells.length

    return {
        id: Array.from({ length: count }, (_, index) => index + 1),
        Nom: Array.from({ length: count }, () => 'RCU Val Fleuri'),
        Installation: Array.from({ length: count }, () => 1),
        Departement_de_situation: [...cells],
        Type_de_plan: Array.from({ length: count }, () => 'création'),
        Usage_principal: Array.from({ length: count }, () => 'énergie'),
        Nature_Donnee: Array.from({ length: count }, () => 'prévision'),
        Statut: Array.from({ length: count }, () => 'projet'),
        est_Laureat: Array.from({ length: count }, () => false),
    }
}

const departementsOf = async () =>
    (await createGristPlanPort().list()).map((plan) => plan.departement)

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristPlanPort', () => {
    // The column is numeric, so Grist stores 01 as the number 1 and the
    // leading zero — a width, not a digit — has to be put back.
    it('puts back the leading zero a numeric column drops', async () => {
        mockGrist(plansPlacedAt([1, 9, 87, 95]))

        await expect(departementsOf()).resolves.toEqual([
            '01',
            '09',
            '87',
            '95',
        ])
    })

    // Corsica and the DROM cannot be numbers, so they reach the widget as text
    // already the right width. Padding has to leave them as they are.
    it('leaves a code that is already wide enough alone', async () => {
        mockGrist(plansPlacedAt(['2A', '2B', '971', '976']))

        await expect(departementsOf()).resolves.toEqual([
            '2A',
            '2B',
            '971',
            '976',
        ])
    })

    // A plan the document places nowhere names no département, and « 00 »
    // would be an invention.
    it('places a plan nowhere when the cell is empty', async () => {
        mockGrist(plansPlacedAt(['', null, undefined]))

        await expect(departementsOf()).resolves.toEqual([null, null, null])
    })

    // A formula returning something other than a département is wrong for
    // every plan at once, so it is refused rather than read as « nowhere ».
    it('refuses a code that names no département', async () => {
        mockGrist(plansPlacedAt([96]))

        await expect(createGristPlanPort().list()).rejects.toThrow(
            /"96", which is not a département code/
        )
    })

    it('refuses the 20 Corsica left vacant', async () => {
        mockGrist(plansPlacedAt([20]))

        await expect(createGristPlanPort().list()).rejects.toThrow(
            /not a département code/
        )
    })

    // 975 is Saint-Pierre-et-Miquelon: a collectivité sitting between two codes
    // that are real départements, so only the rule can tell it apart.
    it('refuses a collectivité', async () => {
        mockGrist(plansPlacedAt(['975']))

        await expect(createGristPlanPort().list()).rejects.toThrow(
            /not a département code/
        )
    })

    // The error has to say where to go, not merely that something is wrong.
    it('names the table and the column it refused', async () => {
        mockGrist(plansPlacedAt([1234]))

        await expect(createGristPlanPort().list()).rejects.toThrow(
            /"Plan_d_approvisionnement".+"Departement_de_situation"/
        )
    })

    // One bad plan condemns the load: the column is computed, so the rest are
    // no more trustworthy than the one that gave itself away.
    it('refuses the whole read for a single bad cell', async () => {
        mockGrist(plansPlacedAt([87, 96, 75]))

        await expect(createGristPlanPort().list()).rejects.toThrow(
            /not a département code/
        )
    })

    // The column is computed by the document. If it is renamed or removed,
    // this must fail loudly rather than place every plan nowhere.
    it('refuses a document whose plan table has no département', async () => {
        const columns = plansPlacedAt([87])
        delete columns.Departement_de_situation

        mockGrist(columns)

        await expect(createGristPlanPort().list()).rejects.toThrow(
            /Departement_de_situation/
        )
    })
})
