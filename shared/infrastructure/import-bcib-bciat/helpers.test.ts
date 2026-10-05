import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { extractRows, findSheetName } from './helpers'

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

const COLUMNS = [
    'Sous catégorie de combustible',
    'Tonnage / an',
    'Répartition approximative par provenance',
]

function workbook(rows: unknown[][]): Blob {
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet(rows),
        'Fournisseurs'
    )

    return new Blob([XLSX.write(book, { type: 'array', bookType: 'xlsx' })])
}

const LINE = ['Scierie Fictive', 'Plaquettes', 1000, '100% 19']

const suppliersOf = async (rows: unknown[][]) =>
    (await extractRows(workbook(rows), 'plan.xlsx')).map(
        ({ supplier }) => supplier
    )

describe('extractRows, header row', () => {
    it.each([
        'Fournisseur',
        'Fournisseurs',
        'fournisseur',
        'FOURNISSEURS',
        'Fournìsseur',
        'Nom du fournisseur',
        'Fournisseurs (raison sociale)',
        'Fournisseurs eventuels (non selectionnés à date)',
    ])('finds the header row when column A reads « %s »', async (header) => {
        expect(await suppliersOf([[header, ...COLUMNS], LINE])).toEqual([
            'Scierie Fictive',
        ])
    })

    it('skips a title mentioning fournisseurs above the header', async () => {
        expect(
            await suppliersOf([
                ['Fournisseurs'],
                ['Aire d’approvisionnement et fournisseurs'],
                ['Prévoir une ligne par fournisseur et sous-catégorie'],
                ['Fournisseur', ...COLUMNS],
                LINE,
            ])
        ).toEqual(['Scierie Fictive'])
    })

    it('numbers the lines from the real header row', async () => {
        const [line] = await extractRows(
            workbook([['Fournisseurs'], ['Fournisseur', ...COLUMNS], LINE]),
            'plan.xlsx'
        )

        expect(line.excelRow).toBe(3)
    })

    it('does not take a column that only contains the letters', async () => {
        await expect(
            suppliersOf([['Fournisseurie', ...COLUMNS], LINE])
        ).rejects.toThrow(
            'aucune des 40 premières lignes de la feuille « Fournisseurs » ne porte le mot « fournisseur » dans la colonne A'
        )
    })

    it('says which columns the closest header lacks', async () => {
        await expect(
            suppliersOf([
                ['Fournisseurs'],
                ['Fournisseur', 'Sous catégorie', 'Tonnage'],
                LINE,
            ])
        ).rejects.toThrow(
            "la ligne d'en-tête 2 de la feuille « Fournisseurs » n'a pas de colonne pour : Provenance"
        )
    })
})
