import { describe, expect, it } from 'vitest'
import { isValidTonnage } from './tonnage'

describe('isValidTonnage', () => {
    it.each([0, 0.25, 1200.5])('accepts %s', (tonnage) => {
        expect(isValidTonnage(tonnage)).toBe(true)
    })

    it.each([-3, NaN, Infinity])('refuses %s', (tonnage) => {
        expect(isValidTonnage(tonnage)).toBe(false)
    })
})
