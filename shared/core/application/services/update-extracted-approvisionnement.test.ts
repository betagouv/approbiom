import { describe, expect, it, vi } from 'vitest'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type { ProvenanceRepartition } from '@shared/core/domain/value-objects/extracted-approvisionnement-provenance-repartition'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import { updateExtractedApprovisionnement } from './update-extracted-approvisionnement'

const RESSOURCE = {
    code: '1A-PFA',
    ademeCode: '2017-1A-PFA',
    title: 'Plaquettes forestières',
    description: '',
}

const DISTRIBUTION: ProvenanceRepartition[] = [
    { source: DEPARTEMENT_FRANCAIS, provenance: '19', percentage: 100 },
]

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
        rawProvenance: '19',
        additionalData: '',
    },
    derived: {
        parsedProvenance: {
            distribution: DISTRIBUTION,
            confidence: 'Explicite',
            unrecognized: [],
        },
        matchedFournisseur: null,
        matchedRessource: null,
    },
})

describe('updateExtractedApprovisionnement', () => {
    it('verifies the line once its changes give it a ressource and a provenance', async () => {
        const port = { update: vi.fn(() => Promise.resolve()) }

        const updated = await updateExtractedApprovisionnement(
            line(NON_VERIFIEE),
            { matchedRessource: RESSOURCE },
            port
        )

        expect(port.update).toHaveBeenCalledWith(7, {
            matchedRessource: RESSOURCE,
            controle: VERIFIEE,
        })
        expect(updated).toMatchObject({
            controle: VERIFIEE,
            derived: { matchedRessource: RESSOURCE },
        })
    })

    it('verifies the line even when nothing was changed', async () => {
        const port = { update: vi.fn(() => Promise.resolve()) }
        const complete = line(NON_VERIFIEE)

        const updated = await updateExtractedApprovisionnement(
            {
                ...complete,
                derived: { ...complete.derived, matchedRessource: RESSOURCE },
            },
            {},
            port
        )

        expect(port.update).toHaveBeenCalledWith(7, { controle: VERIFIEE })
        expect(updated.controle).toBe(VERIFIEE)
    })

    it('leaves the line « Non vérifiée » while it lacks a ressource or a provenance', async () => {
        const port = { update: vi.fn(() => Promise.resolve()) }

        const updated = await updateExtractedApprovisionnement(
            line(VERIFIEE),
            {
                parsedProvenance: {
                    distribution: [],
                    confidence: 'Non résolu',
                    unrecognized: [],
                },
            },
            port
        )

        expect(port.update).toHaveBeenCalledWith(
            7,
            expect.objectContaining({ controle: NON_VERIFIEE })
        )
        expect(updated.controle).toBe(NON_VERIFIEE)
    })

    it('applies the controle given by the switch', async () => {
        const port = { update: vi.fn(() => Promise.resolve()) }

        const updated = await updateExtractedApprovisionnement(
            line(VERIFIEE),
            { controle: NON_VERIFIEE },
            port
        )

        expect(port.update).toHaveBeenCalledWith(7, { controle: NON_VERIFIEE })
        expect(updated.controle).toBe(NON_VERIFIEE)
    })
})
