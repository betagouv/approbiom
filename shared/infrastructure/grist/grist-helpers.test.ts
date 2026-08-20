import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    asIdList,
    fetchRow,
    fetchRows,
    indexByKey,
    toRows,
    type ColumnMajorTable,
} from './grist-helpers'

describe('toRows', () => {
    const records: ColumnMajorTable = {
        id: [1, 2, 3, 4],
        statut: ['obsolète', 'en fonctionnement', 'projet', 'obsolète'],
        nom: ['Nom1', 'Nom2', 'Nom3', 'Nom4'],
    } as const

    it('converts a column-major table into one object per row', () => {
        const rows = toRows(records)

        expect(rows).toEqual([
            { id: 1, statut: 'obsolète', nom: 'Nom1' },
            { id: 2, statut: 'en fonctionnement', nom: 'Nom2' },
            { id: 3, statut: 'projet', nom: 'Nom3' },
            { id: 4, statut: 'obsolète', nom: 'Nom4' },
        ])
    })
})

describe('fetchRows', () => {
    // fetchRows reads `grist.docApi.fetchTable` from the global installed by the
    // Grist plugin script, which does not exist under jsdom. Stub it per test.
    function mockFetchTable(columns: ColumnMajorTable): void {
        vi.stubGlobal('grist', {
            docApi: { fetchTable: vi.fn().mockResolvedValue(columns) },
        })
    }

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('keeps only the requested columns, dropping the rest', async () => {
        mockFetchTable({
            id: [1, 2],
            Statut: ['projet', 'obsolète'],
            Nom: ['Nom1', 'Nom2'],
        })

        const rows = await fetchRows('Plan_d_approvisionnement', ['Statut'])

        expect(rows).toEqual([{ Statut: 'projet' }, { Statut: 'obsolète' }])
    })

    it('keeps the id (rowId) column when it is requested — the join key', async () => {
        mockFetchTable({
            id: [1, 2],
            Nom: ['Nom1', 'Nom2'],
        })

        const rows = await fetchRows('Plan_d_approvisionnement', ['id', 'Nom'])

        expect(rows).toEqual([
            { id: 1, Nom: 'Nom1' },
            { id: 2, Nom: 'Nom2' },
        ])
    })

    it('throws when a requested column is absent from the fetched table', async () => {
        mockFetchTable({
            id: [1, 2],
            Statut: ['projet', 'obsolète'],
        })

        await expect(
            fetchRows('Plan_d_approvisionnement', ['Statut', 'Nom'])
        ).rejects.toThrow('Nom')
    })

    it('lists every missing column in the error message', async () => {
        mockFetchTable({
            id: [1],
            Statut: ['projet'],
        })

        await expect(
            fetchRows('Plan_d_approvisionnement', ['Nom', 'Usage_principal'])
        ).rejects.toThrow('Nom, Usage_principal')
    })
})

describe('fetchRow', () => {
    function mockFetchTable(columns: ColumnMajorTable): void {
        vi.stubGlobal('grist', {
            docApi: { fetchTable: vi.fn().mockResolvedValue(columns) },
        })
    }
    const TABLE_ID = 'Plan_d_approvisionnement'

    it("throws when the row with the id provided doesn't exist", async () => {
        mockFetchTable({
            id: [1, 2],
            Statut: ['projet', 'obsolète'],
        })

        await expect(fetchRow(TABLE_ID, 0)).rejects.toThrow(
            'Row "0 from table Plan_d_approvisionnement has not been found."'
        )
    })
})

describe('asIdList', () => {
    it('reads the ids a list cell carries, dropping the marker', () => {
        expect(asIdList(['L', 1, 2])).toEqual([1, 2])
    })

    it('reads no id at all from an empty cell', () => {
        // An empty Attachments cell is null, not an empty list.
        expect(asIdList(null)).toEqual([])
        expect(asIdList(undefined)).toEqual([])
    })

    it('reads no id from a cell that holds no list', () => {
        expect(asIdList(12)).toEqual([])
        expect(asIdList('L')).toEqual([])
        expect(asIdList(['R', 'Table', 1])).toEqual([])
    })

    it('keeps only the ids that are numbers', () => {
        expect(asIdList(['L', 1, null, 'deux', 3])).toEqual([1, 3])
    })
})

describe('indexByKey', () => {
    it('indexes rows by their numeric key', () => {
        const rows = [
            { id: 1, nom: 'a' },
            { id: 2, nom: 'b' },
        ]

        const index = indexByKey(rows, (row) => row.id)

        expect(index.size).toBe(2)
        expect(index.get(1)).toEqual({ id: 1, nom: 'a' })
        expect(index.get(2)).toEqual({ id: 2, nom: 'b' })
    })

    it('skips rows whose key is null', () => {
        const rows = [{ ref: 1 }, { ref: null }]

        const index = indexByKey(rows, (row) => row.ref)

        expect(index.size).toBe(1)
        expect(index.get(1)).toEqual({ ref: 1 })
    })

    it('keeps the last row on a duplicate key', () => {
        const rows = [
            { id: 1, v: 'first' },
            { id: 1, v: 'second' },
        ]

        const index = indexByKey(rows, (row) => row.id)

        expect(index.size).toBe(1)
        expect(index.get(1)).toEqual({ id: 1, v: 'second' })
    })

    it('returns an empty map for no rows', () => {
        expect(indexByKey([], () => 1).size).toBe(0)
    })
})
