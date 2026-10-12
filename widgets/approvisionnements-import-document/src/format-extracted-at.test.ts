import { describe, expect, it } from 'vitest'
import { formatExtractedAt } from './format-extracted-at'

describe('formatExtractedAt', () => {
    it('gives the day, then the time in hours and minutes', () => {
        expect(formatExtractedAt(new Date(2026, 8, 27, 15, 36))).toBe(
            '27/09/2026 à 15h36'
        )
    })

    it('pads the minutes', () => {
        expect(formatExtractedAt(new Date(2026, 8, 27, 9, 5))).toBe(
            '27/09/2026 à 9h05'
        )
    })
})
