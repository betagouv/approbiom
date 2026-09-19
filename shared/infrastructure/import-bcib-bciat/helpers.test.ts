import { describe, it, expect } from 'vitest'
import { findSheetName } from './helpers'

describe('findSheetName', () => {
    const SHEET_NAME = 'Fournisseurs'
    it('finds the Fournisseurs Sheet when the name of the sheet is exactly Fournisseurs', () => {
        expect(findSheetName(['Fournisseurs'], SHEET_NAME)).toBe('Fournisseurs')
    })
    it('finds the Fournisseurs Sheet when the name of the sheet contains Fournisseurs', () => {
        expect(findSheetName(['2.Fournisseurs'], SHEET_NAME)).toBe(
            '2.Fournisseurs'
        )
    })
    it('finds the Fournisseurs Sheet when the name of the sheet contains is in lowercase', () => {
        expect(findSheetName(['2.fournisseurs'], SHEET_NAME)).toBe(
            '2.fournisseurs'
        )
    })
})
