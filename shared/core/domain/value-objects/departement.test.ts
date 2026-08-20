import { describe, expect, it } from 'vitest'
import {
    DEPARTEMENTS,
    isCodeDepartement,
} from '@shared/core/domain/value-objects/departement'

describe('DEPARTEMENTS', () => {
    it('holds the 101 départements', () => {
        expect(DEPARTEMENTS).toHaveLength(101)
        expect(new Set(DEPARTEMENTS).size).toBe(101)
    })
})

describe('isCodeDepartement', () => {
    it('recognises a metropolitan code, zero included', () => {
        expect(isCodeDepartement('01')).toBe(true)
        expect(isCodeDepartement('87')).toBe(true)
        expect(isCodeDepartement('95')).toBe(true)
    })

    it('recognises Corsica and the DROM', () => {
        expect(isCodeDepartement('2A')).toBe(true)
        expect(isCodeDepartement('2B')).toBe(true)
        expect(isCodeDepartement('971')).toBe(true)
        expect(isCodeDepartement('976')).toBe(true)
    })

    // The code Corsica gave up. It reads like a département and is not one,
    // which is exactly the kind of value a formula can produce by accident.
    it('refuses the 20 Corsica left vacant', () => {
        expect(isCodeDepartement('20')).toBe(false)
    })

    // Collectivités, not départements. 975 sits between two codes that are
    // real, so nothing about its shape gives it away.
    it('refuses a collectivité', () => {
        expect(isCodeDepartement('975')).toBe(false)
        expect(isCodeDepartement('977')).toBe(false)
        expect(isCodeDepartement('978')).toBe(false)
    })

    it('refuses a code no département has ever had', () => {
        expect(isCodeDepartement('00')).toBe(false)
        expect(isCodeDepartement('96')).toBe(false)
        expect(isCodeDepartement('99')).toBe(false)
        expect(isCodeDepartement('870')).toBe(false)
    })

    // The unpadded form a numeric column hands back. It is the adapter's job to
    // widen it first, so the rule itself refuses it.
    it('refuses a code that has not been widened', () => {
        expect(isCodeDepartement('1')).toBe(false)
        expect(isCodeDepartement('9')).toBe(false)
    })

    it('refuses what is not a string at all', () => {
        expect(isCodeDepartement(87)).toBe(false)
        expect(isCodeDepartement(null)).toBe(false)
        expect(isCodeDepartement(undefined)).toBe(false)
    })
})
