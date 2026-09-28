import { describe, expect, it } from 'vitest'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import { matchFournisseur } from './match-fournisseur'

const vallon: Entreprise = {
    denomination: 'SCIERIE FICTIVE DU VALLON',
    siret: '00000000000003',
}
const cooperative: Entreprise = {
    denomination: 'COOPERATIVE FICTIVE DES FORETS',
    siret: '00000000000002',
}
const entreprises = [vallon, cooperative]

describe('matchFournisseur', () => {
    it('finds the entreprise by its denomination', () => {
        expect(matchFournisseur('SCIERIE FICTIVE DU VALLON', entreprises)).toBe(
            vallon
        )
    })

    it('ignores case, accents and extra spaces in the denomination', () => {
        expect(
            matchFournisseur('  Coopérative  fictive des Forêts ', entreprises)
        ).toBe(cooperative)
    })

    it('falls back on the siret when no denomination matches', () => {
        expect(matchFournisseur('000 000 000 00003', entreprises)).toBe(vallon)
    })

    it('prefers the denomination over the siret', () => {
        const namedLikeASiret: Entreprise = {
            denomination: '00000000000002',
            siret: '11111111111111',
        }

        expect(
            matchFournisseur('00000000000002', [cooperative, namedLikeASiret])
        ).toBe(namedLikeASiret)
    })

    it('returns null when nothing matches', () => {
        expect(matchFournisseur('Ets Imaginaire', entreprises)).toBeNull()
    })

    it('returns null for an empty supplier', () => {
        expect(
            matchFournisseur('', [
                ...entreprises,
                { denomination: '', siret: '' },
            ])
        ).toBeNull()
    })

    it('detects the correct denomination even if there is other comments', () => {
        expect(
            matchFournisseur(
                'COOPERATIVE FICTIVE DES FORETS (autoconsommation)',
                [...entreprises, { denomination: '', siret: '' }]
            )
        ).toBe(cooperative)
    })

    it('finds the denomination anywhere in the supplier', () => {
        expect(
            matchFournisseur(
                'qsdqdqs COOPERATIVE FICTIVE DES FORETS qsdqsd',
                entreprises
            )
        ).toBe(cooperative)
    })

    it('only matches whole words of the denomination', () => {
        const bois: Entreprise = { denomination: 'BOIS', siret: '1' }

        expect(matchFournisseur('BOISERIE DUPONT', [bois])).toBeNull()
    })

    it('prefers the most specific denomination when several appear', () => {
        const vallonEtFils: Entreprise = {
            denomination: 'SCIERIE FICTIVE DU VALLON ET FILS',
            siret: '2',
        }

        expect(
            matchFournisseur('SARL SCIERIE FICTIVE DU VALLON ET FILS', [
                vallon,
                vallonEtFils,
            ])
        ).toBe(vallonEtFils)
    })
})
