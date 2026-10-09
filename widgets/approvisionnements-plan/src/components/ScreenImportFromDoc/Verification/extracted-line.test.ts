import { describe, expect, it } from 'vitest'
import { NON_VERIFIEE } from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import { distributionSummary } from './extracted-line'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'

const RESSOURCE = {
    code: '1A-PFA',
    ademeCode: '2017-1A-PFA',
    title: 'Plaquettes forestières',
    description: '',
}

function line(
    percentages: readonly (number | null)[],
    changes: Partial<ExtractedApprovisionnement['derived']> = {}
): ExtractedApprovisionnement {
    return {
        id: 1,
        controle: NON_VERIFIEE,
        extractedAt: new Date(),
        read: {
            document: 'plan.xlsx',
            excelRow: 17,
            supplier: 'Scierie',
            resource: 'Plaquettes',
            tonnage: 1000,
            rawProvenance: '',
            additionalData: '',
        },
        derived: {
            parsedProvenance: {
                distribution: percentages.map((percentage) => ({
                    source: DEPARTEMENT_FRANCAIS,
                    provenance: percentage === null ? '' : '19',
                    percentage: percentage ?? 0,
                })),
                confidence: 'Explicite',
                unrecognized: [],
            },
            matchedFournisseur: null,
            matchedRessource: RESSOURCE,
            ...changes,
        },
    }
}

describe('distributionSummary', () => {
    it('counts the provenances and adds them up', () => {
        expect(distributionSummary(line([50, 30, 20]))).toBe(
            '3 provenances · 100 %'
        )
        expect(distributionSummary(line([]))).toBe('Aucune provenance')
    })
})
