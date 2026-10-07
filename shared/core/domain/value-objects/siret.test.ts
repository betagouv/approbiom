import { describe, expect, it } from 'vitest'
import {
    digitsOf,
    formatSiret,
    validateSiret,
} from '@shared/core/domain/value-objects/siret'

describe('digitsOf', () => {
    it('leaves the spaces out', () => {
        expect(digitsOf(' 412 345 678 00019 ')).toBe('41234567800019')
    })
})

describe('validateSiret', () => {
    it('accepts 14 digits, spaces left out', () => {
        expect(validateSiret('412 345 678 00019')).toEqual({
            ok: true,
            siret: '41234567800019',
        })
    })

    it.each([
        ['412a', 'not-digits', 4],
        ['   ', 'empty', 0],
        ['412', 'too-short', 3],
        ['412345678000190', 'too-long', 15],
    ])('refuses « %s »: %s', (text, problem, digitCount) => {
        expect(validateSiret(text)).toEqual({ ok: false, problem, digitCount })
    })
})

describe('formatSiret', () => {
    it('groups the SIREN in threes, then the NIC', () => {
        expect(formatSiret('41234567800019')).toBe('412 345 678 00019')
    })

    it('formats what is typed so far', () => {
        expect(formatSiret('4123')).toBe('412 3')
    })
})
