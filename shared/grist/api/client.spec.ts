import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRows, toRows, type ColumnMajorTable } from './client'

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
