import { describe, expect, it } from 'vitest'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'
import {
    countVerified,
    isNot100,
    isVerifiable,
    toApprovisionnements,
    type ExtractedApprovisionnement,
} from './extracted-approvisionnement'

const RESSOURCE = {
    code: '1A-PFA',
    ademeCode: '2017-1A-PFA',
    title: 'Plaquettes forestières',
    description: '',
}

function line(
    percentages: readonly (number | null)[],
    changes: Partial<ExtractedApprovisionnement['derived']> = {},
    controle: ExtractedApprovisionnement['controle'] = NON_VERIFIEE
): ExtractedApprovisionnement {
    return {
        id: 1,
        controle,
        extractedAt: new Date(),
        read: {
            document: 'plan.xlsx',
            excelRow: 17,
            supplier: 'Scierie',
            resource: 'Plaquettes',
            tonnage: 1000,
            rawProvenance: '',
            additionalData: 'PCI: 2,8',
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

describe('isVerifiable', () => {
    it('takes a ressource and provenances, without fournisseur', () => {
        expect(isVerifiable(line([60, 40]))).toBe(true)
    })

    it('waits for a ressource', () => {
        expect(isVerifiable(line([100], { matchedRessource: null }))).toBe(
            false
        )
    })

    it('waits for a provenance', () => {
        expect(isVerifiable(line([]))).toBe(false)
        expect(isVerifiable(line([50, null]))).toBe(false)
    })

    it('does not mind a total off 100 %', () => {
        expect(isVerifiable(line([60]))).toBe(true)
    })
})

describe('isNot100', () => {
    it('says when the total is off 100 %', () => {
        expect(isNot100(line([60]))).toBe(true)
        expect(isNot100(line([33.33, 33.33, 33.34]))).toBe(false)
        expect(isNot100(line([]))).toBe(false)
    })
})

describe('countVerified', () => {
    it('counts the verified lines', () => {
        expect(
            countVerified([
                line([100], {}, NON_VERIFIEE),
                line([100], {}, VERIFIEE),
            ])
        ).toBe(1)
    })
})

describe('toApprovisionnements', () => {
    const twoProvenances = (
        changes: Partial<ExtractedApprovisionnement['derived']> = {}
    ) =>
        line([], {
            parsedProvenance: {
                distribution: [
                    {
                        source: DEPARTEMENT_FRANCAIS,
                        provenance: '19',
                        percentage: 60,
                    },
                    {
                        source: PAYS_ETRANGER,
                        provenance: 'Espagne',
                        percentage: 40,
                    },
                ],
                confidence: 'Explicite',
                unrecognized: [],
            },
            matchedFournisseur: {
                siret: '00000000000001',
                denomination: 'BOIS FICTIF ENERGIE',
            },
            ...changes,
        })

    it('makes one approvisionnement per provenance, from the document', () => {
        expect(toApprovisionnements(twoProvenances(), 30, 341)).toEqual([
            {
                planDApprovisionnement: 30,
                fournisseur: '00000000000001',
                ressource: '1A-PFA',
                provenance: { source: DEPARTEMENT_FRANCAIS, code: '19' },
                tonnageTotal: 600,
                additionalDataFromDocument: 'PCI: 2,8',
                source: 341,
            },
            {
                planDApprovisionnement: 30,
                fournisseur: '00000000000001',
                ressource: '1A-PFA',
                provenance: { source: PAYS_ETRANGER, libelle: 'Espagne' },
                tonnageTotal: 400,
                additionalDataFromDocument: 'PCI: 2,8',
                source: 341,
            },
        ])
    })

    it('leaves the fournisseur out when none was chosen', () => {
        const [approvisionnement] = toApprovisionnements(
            twoProvenances({ matchedFournisseur: null }),
            30,
            341
        )

        expect(approvisionnement.fournisseur).toBeUndefined()
    })

    it('makes none for a line without ressource', () => {
        expect(
            toApprovisionnements(
                twoProvenances({ matchedRessource: null }),
                30,
                341
            )
        ).toEqual([])
    })
})
