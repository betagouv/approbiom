import { describe, expect, it } from 'vitest'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import { matchFournisseur } from './match-fournisseur'

const lagarde: Entreprise = {
    denomination: 'SCIERIE LAGARDE',
    siret: '40122587300027',
}
const onf: Entreprise = {
    denomination: 'OFFICE NATIONAL DES FORETS',
    siret: '66204311600018',
}
const entreprises = [lagarde, onf]

describe('matchFournisseur', () => {
    it('finds the entreprise by its denomination', () => {
        expect(matchFournisseur('SCIERIE LAGARDE', entreprises)).toBe(lagarde)
    })

    it('ignores case, accents and extra spaces in the denomination', () => {
        expect(
            matchFournisseur('  Office  national des Forêts ', entreprises)
        ).toBe(onf)
    })

    it('falls back on the siret when no denomination matches', () => {
        expect(matchFournisseur('401 225 873 00027', entreprises)).toBe(lagarde)
    })

    it('prefers the denomination over the siret', () => {
        const namedLikeASiret: Entreprise = {
            denomination: '66204311600018',
            siret: '11111111111111',
        }

        expect(matchFournisseur('66204311600018', [onf, namedLikeASiret])).toBe(
            namedLikeASiret
        )
    })

    it('returns null when nothing matches', () => {
        expect(matchFournisseur('Ets Dupuy', entreprises)).toBeNull()
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
            matchFournisseur('OFFICE NATIONAL DES FORETS (autoconsommation)', [
                ...entreprises,
                { denomination: '', siret: '' },
            ])
        ).toBe(onf)
    })

    it('finds the denomination anywhere in the supplier', () => {
        expect(
            matchFournisseur(
                'qsdqdqs OFFICE NATIONAL DES FORETS qsdqsd',
                entreprises
            )
        ).toBe(onf)
    })

    it('only matches whole words of the denomination', () => {
        const bois: Entreprise = { denomination: 'BOIS', siret: '1' }

        expect(matchFournisseur('BOISERIE DUPONT', [bois])).toBeNull()
    })

    it('prefers the most specific denomination when several appear', () => {
        const lagardeEtFils: Entreprise = {
            denomination: 'SCIERIE LAGARDE ET FILS',
            siret: '2',
        }

        expect(
            matchFournisseur('SARL SCIERIE LAGARDE ET FILS', [
                lagarde,
                lagardeEtFils,
            ])
        ).toBe(lagardeEtFils)
    })
})
