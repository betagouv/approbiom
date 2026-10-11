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
        'Client',
        'Clients',
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

    it('skips a title mentioning fournisseurs above a header reading « Client »', async () => {
        expect(
            await suppliersOf([
                ['Aire d’approvisionnement et fournisseurs'],
                ['Prévoir une ligne par fournisseur et sous-catégorie'],
                ['Client', ...COLUMNS],
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
            "aucune des 40 premières lignes de la feuille « Fournisseurs » n'est une ligne d'en-tête : le mot « fournisseur » ou « client » en colonne A, et au moins une colonne Ressource, Tonnage ou Provenance"
        )
    })

    it('finds the provenance column when its header does not start with « Répartition approximative »', async () => {
        const [line] = await extractRows(
            workbook([
                [
                    'Fournisseur',
                    'Sous catégorie de combustible',
                    'Tonnage / an',
                    "A titre d'information, répartition approximative du combustible par département",
                ],
                LINE,
            ]),
            'plan.xlsx'
        )

        expect(line.rawProvenance).toBe('100% 19')
    })

    it('finds the ressource column when its header reads « Nature combustible »', async () => {
        const [line] = await extractRows(
            workbook([
                [
                    'Fournisseur',
                    'Nature combustible',
                    'Tonnage / an',
                    'Répartition approximative par provenance',
                ],
                LINE,
            ]),
            'plan.xlsx'
        )

        expect(line.resource).toBe('Plaquettes')
    })

    it('does not take a title mentioning fournisseurs for the header', async () => {
        await expect(
            suppliersOf([
                ['Aire d’approvisionnement et fournisseurs'],
                ['Prévoir une ligne par fournisseur et sous-catégorie'],
                ['Société', ...COLUMNS],
                LINE,
            ])
        ).rejects.toThrow(
            "aucune des 40 premières lignes de la feuille « Fournisseurs » n'est une ligne d'en-tête : le mot « fournisseur » ou « client » en colonne A, et au moins une colonne Ressource, Tonnage ou Provenance"
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

describe('extractRows, tonnage', () => {
    it.each([
        ['vide', null],
        ['du texte', 'à définir'],
    ])(
        'reads 0 t when the tonnage cell is %s and keeps the other lines',
        async (_, cell) => {
            const lines = await extractRows(
                workbook([
                    ['Fournisseur', ...COLUMNS],
                    LINE,
                    ['Scierie Secours', 'Plaquettes', cell, '100% 24'],
                ]),
                'plan.xlsx'
            )

            expect(
                lines.map(({ supplier, tonnage }) => [supplier, tonnage])
            ).toEqual([
                ['Scierie Fictive', 1000],
                ['Scierie Secours', 0],
            ])
        }
    )
})

describe('extractRows, end of the table', () => {
    const HEADER = ['Fournisseur', ...COLUMNS]
    const linesOf = async (rows: unknown[][]) =>
        (await extractRows(workbook(rows), 'plan.xlsx')).map(
            ({ excelRow, supplier, tonnage }) => [excelRow, supplier, tonnage]
        )

    it('keeps reading past a line whose fournisseur is empty', async () => {
        expect(
            await linesOf([
                HEADER,
                LINE,
                [null, 'Bois fin de vie', 700, '100% 87'],
                ['Scierie Voisine', 'Écorces', 14930, '100% 23'],
            ])
        ).toEqual([
            [2, 'Scierie Fictive', 1000],
            [3, '', 700],
            [4, 'Scierie Voisine', 14930],
        ])
    })

    it('keeps reading past blank lines', async () => {
        expect(
            await linesOf([
                HEADER,
                LINE,
                [],
                [],
                ['Scierie Voisine', 'Écorces', 14930, '100% 23'],
            ])
        ).toEqual([
            [2, 'Scierie Fictive', 1000],
            [5, 'Scierie Voisine', 14930],
        ])
    })

    it.each(['TOTAL', 'Total', 'Total général'])(
        'stops at the « %s » line',
        async (total) => {
            expect(
                await linesOf([
                    HEADER,
                    LINE,
                    [total, null, 1000],
                    ['Scierie Après', 'Écorces', 500, '100% 23'],
                ])
            ).toEqual([[2, 'Scierie Fictive', 1000]])
        }
    )

    it('stops at the header of another table', async () => {
        expect(
            await linesOf([
                HEADER,
                LINE,
                [],
                ['Atelier Granulation'],
                HEADER,
                ['Scierie Après', 'Écorces', 500, '100% 23'],
            ])
        ).toEqual([[2, 'Scierie Fictive', 1000]])
    })

    it('skips a line with neither ressource nor tonnage', async () => {
        expect(
            await linesOf([
                HEADER,
                LINE,
                ['Atelier Granulation'],
                ['* PCI sur brut'],
                [null, null, 0],
            ])
        ).toEqual([[2, 'Scierie Fictive', 1000]])
    })
})
