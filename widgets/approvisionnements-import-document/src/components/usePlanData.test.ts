import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { usePlanData, type PlanDataSources } from './usePlanData'

function renderData(sources: Partial<PlanDataSources> = {}) {
    return renderHook(() =>
        usePlanData({
            entreprises: [],
            pays: [],
            extractions: [],
            imported: new Map(),
            createEntreprise: () => Promise.resolve(),
            createPays: () => Promise.resolve(),
            listExtractions: () => Promise.resolve([]),
            countImported: () => Promise.resolve(new Map()),
            ...sources,
        })
    )
}

describe('usePlanData', () => {
    it('adds a created entreprise and a created pays', async () => {
        const { result } = renderData()
        const entreprise = {
            denomination: 'SCIERIE FICTIVE DU VALLON',
            siret: '00000000000003',
        }

        await act(() => result.current.addEntreprise(entreprise))
        await act(() => result.current.addPays({ libelle: 'Espagne' }))

        expect(result.current.entreprises).toEqual([entreprise])
        expect(result.current.pays).toEqual([{ libelle: 'Espagne' }])
    })

    it('reads the extractions again', async () => {
        const summary = {
            attachmentId: 20,
            extractedAt: null,
            lineCount: 1,
            verifiedCount: 0,
        }
        const { result } = renderData({
            listExtractions: vi.fn(() => Promise.resolve([summary])),
        })

        act(() => result.current.refreshExtractions())

        await waitFor(() =>
            expect(result.current.extractions).toEqual([summary])
        )
    })

    it('counts the imported approvisionnements again', async () => {
        const counts = new Map([[341, 2]])
        const { result } = renderData({
            countImported: () => Promise.resolve(counts),
        })

        act(() => result.current.refreshImported())

        await waitFor(() => expect(result.current.imported).toEqual(counts))
    })
})
