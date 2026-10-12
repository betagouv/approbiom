import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ExtractedLinesNotDeletedError } from '@shared/core/application/services/import-extracted-approvisionnements'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import { usePlanData, type PlanDataSources } from './usePlanData'

const APPROVISIONNEMENT: Approvisionnement = {
    id: 1,
    planDApprovisionnement: 30,
    ressource: '1A-PFA',
    provenance: { source: DEPARTEMENT_FRANCAIS, code: '19' },
    tonnageTotal: 100,
}

function renderData(sources: Partial<PlanDataSources> = {}) {
    return renderHook(() =>
        usePlanData({
            approvisionnements: [APPROVISIONNEMENT],
            entreprises: [],
            pays: [],
            extractions: [],
            createApprovisionnements: () => Promise.resolve([2]),
            updateApprovisionnement: () => Promise.resolve(),
            deleteApprovisionnement: () => Promise.resolve(),
            createEntreprise: () => Promise.resolve(),
            createPays: () => Promise.resolve(),
            listExtractions: () => Promise.resolve([]),
            importExtractedApprovisionnements: () => Promise.resolve([]),
            ...sources,
        })
    )
}

describe('usePlanData', () => {
    it('adds a created approvisionnement with the id it was given', async () => {
        const { result } = renderData()

        await act(() =>
            result.current.create(30, {
                ressource: '2A-CIB',
                provenance: { source: DEPARTEMENT_FRANCAIS, code: '23' },
                tonnageTotal: 50,
                fournisseur: undefined,
            })
        )

        expect(result.current.approvisionnements.map(({ id }) => id)).toEqual([
            1, 2,
        ])
    })

    it('updates then removes an approvisionnement', async () => {
        const { result } = renderData()

        await act(() => result.current.update(1, { tonnageTotal: 80 }))
        expect(result.current.approvisionnements[0].tonnageTotal).toBe(80)

        await act(() => result.current.remove(1))
        expect(result.current.approvisionnements).toEqual([])
    })

    it('keeps what an import created even when its lines could not be deleted', async () => {
        const created = { ...APPROVISIONNEMENT, id: 3 }
        const { result } = renderData({
            importExtractedApprovisionnements: () =>
                Promise.reject(new ExtractedLinesNotDeletedError([created])),
        })

        await act(async () => {
            await expect(
                result.current.importLines([], 30, 276)
            ).rejects.toBeInstanceOf(ExtractedLinesNotDeletedError)
        })

        expect(result.current.approvisionnements).toContainEqual(created)
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
})
