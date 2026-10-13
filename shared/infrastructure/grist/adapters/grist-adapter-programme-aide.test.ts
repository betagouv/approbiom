import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../helpers/grist-helpers'
import { createGristProgrammeAidePort } from './grist-adapter-programme-aide'

// `Annee` is a Date column: Grist hands it over as the seconds of the 1st of
// January of that year, at midnight UTC.
const PROG_AIDES: ColumnMajorTable = {
    id: [1, 2],
    Annee: [1735689600, null],
    Nom_complet: ['Chaleur renouvelable', 'Sans année'],
    Nom_raccourci: ['CRA', 'SANS'],
    Appel_a_projet: ['CRA (2025)', ''],
    Laureat: [0, 0],
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristProgrammeAidePort', () => {
    it('reads the year of the Annee date, and 0 when it is left empty', async () => {
        vi.stubGlobal('grist', {
            docApi: { fetchTable: vi.fn(() => Promise.resolve(PROG_AIDES)) },
            ready: vi.fn(),
            onOptions: (
                handler: (
                    options: unknown,
                    settings: { accessLevel: string }
                ) => void
            ) => handler({}, { accessLevel: 'full' }),
        })

        const programmes = await createGristProgrammeAidePort().list()

        expect(programmes.map(({ year }) => year)).toEqual([2025, 0])
    })
})
