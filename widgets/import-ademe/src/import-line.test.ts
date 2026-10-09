import { describe, expect, it, vi } from 'vitest'
import type { ExtractedApprovisionnement } from './extracted-approvisionnement-port'
import { importLine, toApprovisionnements } from './import-line'
import { NON_VERIFIEE } from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'

const vallon = {
    denomination: 'SCIERIE FICTIVE DU VALLON',
    siret: '00000000000003',
}
const plaquettes = {
    code: '1A-PFA',
    ademeCode: '2017-1A-PFA',
    title: 'Plaquettes forestières',
    description: 'Plaquettes forestières dont souches et rémanents',
}

function line(
    derived: Partial<ExtractedApprovisionnement['derived']> = {}
): ExtractedApprovisionnement {
    return {
        id: 7,
        controle: NON_VERIFIEE,
        extractedAt: new Date('2026-09-27'),
        read: {
            document: 'plan.xlsx',
            excelRow: 17,
            supplier: 'Scierie Fictive du Vallon',
            resource: 'Plaquettes forestières',
            tonnage: 1000,
            rawProvenance: '70% 19, 30% Espagne',
            additionalData: 'PCI: 2,8',
        },
        derived: {
            parsedProvenance: {
                distribution: [
                    {
                        source: 'Département français',
                        provenance: '19',
                        percentage: 70,
                    },
                    {
                        source: 'Pays étranger',
                        provenance: 'Espagne',
                        percentage: 30,
                    },
                ],
                confidence: 'Explicite',
                unrecognized: [],
            },
            matchedFournisseur: vallon,
            matchedRessource: plaquettes,
            ...derived,
        },
    }
}

describe('toApprovisionnements', () => {
    it('makes one approvisionnement per provenance, with its share of the tonnage', () => {
        expect(toApprovisionnements(line(), 160, 20)).toEqual([
            {
                planDApprovisionnement: 160,
                fournisseur: '00000000000003',
                ressource: '1A-PFA',
                provenance: { source: 'Département français', code: '19' },
                tonnageTotal: 700,
                additionalDataFromDocument: 'PCI: 2,8',
                source: 20,
            },
            {
                planDApprovisionnement: 160,
                fournisseur: '00000000000003',
                ressource: '1A-PFA',
                provenance: { source: 'Pays étranger', libelle: 'Espagne' },
                tonnageTotal: 300,
                additionalDataFromDocument: 'PCI: 2,8',
                source: 20,
            },
        ])
    })

    it('makes them without fournisseur when it is not given', () => {
        const approvisionnements = toApprovisionnements(
            line({ matchedFournisseur: null }),
            160,
            20
        )

        expect(approvisionnements).toHaveLength(2)
        expect(
            approvisionnements.map(({ fournisseur }) => fournisseur)
        ).toEqual([undefined, undefined])
    })

    it('makes none without a ressource', () => {
        expect(
            toApprovisionnements(line({ matchedRessource: null }), 160, 20)
        ).toEqual([])
    })

    it('makes none without a provenance', () => {
        expect(
            toApprovisionnements(
                line({
                    parsedProvenance: {
                        distribution: [],
                        confidence: 'Non résolu',
                        unrecognized: [],
                    },
                }),
                160,
                20
            )
        ).toEqual([])
    })
})

describe('importLine', () => {
    it('creates the approvisionnements', async () => {
        const create = vi.fn(() => Promise.resolve([]))
        const approvisionnements = toApprovisionnements(line(), 160, 20)

        await importLine(approvisionnements, {
            approvisionnements: { create },
        })

        expect(create).toHaveBeenCalledWith(approvisionnements)
    })
})
