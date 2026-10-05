import { describe, expect, it } from 'vitest'
import { checkSiret, formatSiret, isNumericQuery } from './siret'

const ENTREPRISES = [
    { siret: '00000000000003', denomination: 'SCIERIE FICTIVE DU VALLON' },
]

describe('formatSiret', () => {
    it('groups the SIREN in threes, then the NIC', () => {
        expect(formatSiret('41234567800019')).toBe('412 345 678 00019')
    })

    it('formats what is typed so far', () => {
        expect(formatSiret('4123')).toBe('412 3')
    })
})

describe('isNumericQuery', () => {
    it('ignores spaces', () => {
        expect(isNumericQuery('412 345')).toBe(true)
        expect(isNumericQuery('Scierie 12')).toBe(false)
    })
})

describe('checkSiret', () => {
    it('accepts 14 digits, spaces left out', () => {
        expect(checkSiret('412 345 678 00019', ENTREPRISES)).toEqual({
            ok: true,
            siret: '41234567800019',
        })
    })

    it('refuses anything but digits, at once', () => {
        expect(checkSiret('412a', ENTREPRISES)).toMatchObject({
            error: 'Le SIRET ne doit contenir que des chiffres.',
            immediate: true,
        })
    })

    it('asks for a SIRET', () => {
        expect(checkSiret('  ', ENTREPRISES)).toMatchObject({
            error: 'Renseignez le SIRET du fournisseur.',
            immediate: false,
        })
    })

    it('counts the digits, and complains at once past 14', () => {
        expect(checkSiret('412', ENTREPRISES)).toMatchObject({
            error: 'Le SIRET doit contenir 14 chiffres (3 saisis).',
            immediate: false,
        })
        expect(checkSiret('1', ENTREPRISES)).toMatchObject({
            error: 'Le SIRET doit contenir 14 chiffres (1 saisi).',
        })
        expect(checkSiret('412345678000190', ENTREPRISES)).toMatchObject({
            immediate: true,
        })
    })

    it('names the fournisseur that already has the SIRET', () => {
        expect(checkSiret('00000000000003', ENTREPRISES)).toEqual({
            ok: false,
            error: 'Ce SIRET est déjà utilisé par le fournisseur « SCIERIE FICTIVE DU VALLON ».',
            immediate: true,
            duplicate: ENTREPRISES[0],
        })
    })
})
