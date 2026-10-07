import { describe, expect, it } from 'vitest'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import { loadImportProgress } from './import-progress'

function approvisionnement(planDApprovisionnement: number): Approvisionnement {
    return {
        id: 1,
        planDApprovisionnement,
        fournisseur: '00000000000003',
        ressource: '1A-PFA',
        provenance: { source: 'Département français', code: '19' },
        tonnageTotal: 100,
    }
}

describe('loadImportProgress', () => {
    it('counts the approvisionnements of each plan', async () => {
        const { approvisionnementCounts } = await loadImportProgress({
            extractedApprovisionnements: {
                listSummaries: () => Promise.resolve([]),
            },
            approvisionnements: {
                list: () =>
                    Promise.resolve([
                        approvisionnement(160),
                        approvisionnement(160),
                        approvisionnement(240),
                    ]),
            },
        })

        expect(approvisionnementCounts.get(160)).toBe(2)
        expect(approvisionnementCounts.get(240)).toBe(1)
        expect(approvisionnementCounts.get(183)).toBeUndefined()
    })

    it('finds the extraction of each document', async () => {
        const summary = {
            attachmentId: 20,
            extractedAt: new Date('2026-09-27'),
            lineCount: 4,
            createdCount: 1,
        }

        const { extractions } = await loadImportProgress({
            extractedApprovisionnements: {
                listSummaries: () => Promise.resolve([summary]),
            },
            approvisionnements: { list: () => Promise.resolve([]) },
        })

        expect(extractions.get(20)).toEqual(summary)
    })
})
