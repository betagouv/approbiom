import { describe, expect, it } from 'vitest'
import { formatNumber, plural } from './format'

describe('formatNumber', () => {
    it('writes a number the French way, to one decimal', () => {
        expect(formatNumber(1200.56).replace(/\s/g, ' ')).toBe('1 200,6')
    })
})

describe('plural', () => {
    it('adds an s past one', () => {
        expect(plural(0, 'ligne')).toBe('0 ligne')
        expect(plural(1, 'ligne')).toBe('1 ligne')
        expect(plural(2, 'ligne')).toBe('2 lignes')
    })
})
