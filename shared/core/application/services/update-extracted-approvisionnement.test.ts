import { describe, expect, it, vi } from 'vitest'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import { updateExtractedApprovisionnement } from './update-extracted-approvisionnement'

const RESSOURCE = {
    code: '1A-PFA',
    ademeCode: '2017-1A-PFA',
    title: 'Plaquettes forestières',
    description: '',
}

const line = (
    controle: ExtractedApprovisionnement['controle']
): ExtractedApprovisionnement => ({
    id: 7,
    controle,
    extractedAt: new Date(),
    read: {
        document: 'plan.xlsx',
        excelRow: 17,
        supplier: 'Scierie',
        resource: 'Plaquettes',
        tonnage: 100,
        rawProvenance: '',
        additionalData: '',
    },
    derived: {
        parsedProvenance: {
            distribution: [],
            confidence: 'Non résolu',
            unrecognized: [],
        },
        matchedFournisseur: null,
        matchedRessource: null,
    },
})

describe('updateExtractedApprovisionnement', () => {
    it('puts a verified line back to « Non vérifiée » when it changes', async () => {
        const port = { update: vi.fn(() => Promise.resolve()) }

        const updated = await updateExtractedApprovisionnement(
            line(VERIFIEE),
            { matchedRessource: RESSOURCE },
            port
        )

        expect(port.update).toHaveBeenCalledWith(7, {
            matchedRessource: RESSOURCE,
            controle: NON_VERIFIEE,
        })
        expect(updated).toMatchObject({
            controle: NON_VERIFIEE,
            derived: { matchedRessource: RESSOURCE },
        })
    })

    it('leaves the controle of a line not verified yet', async () => {
        const port = { update: vi.fn(() => Promise.resolve()) }

        await updateExtractedApprovisionnement(
            line(NON_VERIFIEE),
            { matchedRessource: RESSOURCE },
            port
        )

        expect(port.update).toHaveBeenCalledWith(7, {
            matchedRessource: RESSOURCE,
        })
    })

    it('verifies a line', async () => {
        const port = { update: vi.fn(() => Promise.resolve()) }

        const updated = await updateExtractedApprovisionnement(
            line(NON_VERIFIEE),
            { controle: VERIFIEE },
            port
        )

        expect(port.update).toHaveBeenCalledWith(7, { controle: VERIFIEE })
        expect(updated.controle).toBe(VERIFIEE)
    })
})
