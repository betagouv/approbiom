import { describe, expect, it, vi } from 'vitest'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'
import { VERIFIEE } from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import {
    ApprovisionnementsNotCreatedError,
    ExtractedLinesNotDeletedError,
    importExtractedApprovisionnements,
} from './import-extracted-approvisionnements'

const line: ExtractedApprovisionnement = {
    id: 8,
    controle: VERIFIEE,
    extractedAt: new Date(),
    read: {
        document: 'plan.xlsx',
        excelRow: 18,
        supplier: 'Scierie',
        resource: 'Plaquettes',
        tonnage: 1000,
        rawProvenance: '',
        additionalData: '',
    },
    derived: {
        parsedProvenance: {
            distribution: [
                {
                    source: DEPARTEMENT_FRANCAIS,
                    provenance: '19',
                    percentage: 60,
                },
                {
                    source: DEPARTEMENT_FRANCAIS,
                    provenance: '87',
                    percentage: 40,
                },
            ],
            confidence: 'Explicite',
            unrecognized: [],
        },
        matchedFournisseur: null,
        matchedRessource: {
            code: '1A-PFA',
            ademeCode: '2017-1A-PFA',
            title: 'Plaquettes forestières',
            description: '',
        },
    },
}

function ports() {
    return {
        approvisionnements: {
            create: vi.fn(() => Promise.resolve([101, 102])),
        },
        extractedApprovisionnements: {
            deleteLines: vi.fn(() => Promise.resolve()),
        },
    }
}

describe('importExtractedApprovisionnements', () => {
    it('creates the approvisionnements, then deletes the lines', async () => {
        const dependencies = ports()

        const created = await importExtractedApprovisionnements(
            [line],
            30,
            341,
            dependencies
        )

        expect(created).toMatchObject([
            {
                id: 101,
                planDApprovisionnement: 30,
                source: 341,
                tonnageTotal: 600,
            },
            { id: 102, tonnageTotal: 400 },
        ])
        expect(
            dependencies.extractedApprovisionnements.deleteLines
        ).toHaveBeenCalledWith([8])
    })

    it('keeps the lines when the creation fails', async () => {
        const dependencies = ports()
        dependencies.approvisionnements.create.mockRejectedValue(
            new Error('Grist')
        )

        await expect(
            importExtractedApprovisionnements([line], 30, 341, dependencies)
        ).rejects.toBeInstanceOf(ApprovisionnementsNotCreatedError)
        expect(
            dependencies.extractedApprovisionnements.deleteLines
        ).not.toHaveBeenCalled()
    })

    it('tells what was created when the lines cannot be deleted', async () => {
        const dependencies = ports()
        dependencies.extractedApprovisionnements.deleteLines.mockRejectedValue(
            new Error('Grist')
        )

        const error: unknown = await importExtractedApprovisionnements(
            [line],
            30,
            341,
            dependencies
        ).catch((caught: unknown) => caught)

        expect(error).toBeInstanceOf(ExtractedLinesNotDeletedError)
        expect((error as ExtractedLinesNotDeletedError).created).toHaveLength(2)
    })
})
