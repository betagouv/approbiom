import * as XLSX from 'xlsx'
import { normalize } from './transform-provenance/reference-data'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import type { ProvenanceParseResults } from './transform-provenance/transform-provenance'
import type { CellValue } from 'grist/GristData'

// - - - - - Configurations - - - - - - //

// Input - Workbook structure
const EXPECTED_WORD_CONTAINED_IN_SHEETNAME = 'Fournisseurs'

const EXPECTED_HEADER_COLUMN_FOURNISSEUR = /(?<![a-z])fournisseurs?(?![a-z])/

const COLUMN_HEADER_PREFIXES = {
    Ressource: 'sous categorie',
    Tonnage: 'tonnage',
    Provenance: 'repartition approximative',
} as const

const ADDITIONAL_COLUMN_HEADER_PREFIXES = {
    PCI: 'pci',
    'Fournisseur certifié': 'fournisseur certifie',
    'Taux PEFC': 'taux',
} as const

// How far down to look for the header row. It sits on row 11, 16 or 18
// depending on which year's template the plan was written on.
const MAX_ROW_HEADER_SEARCH = 40

// Output

type ColumnName = 'Fournisseur' | keyof typeof COLUMN_HEADER_PREFIXES

export type ReadLine = {
    document: string
    excelRow: number
    supplier: string
    resource: string
    tonnage: number
    rawProvenance: string
    additionalData: string
}

export type ExtractedLine = {
    read: ReadLine
    derived: {
        parsedProvenance: ProvenanceParseResults
        matchedFournisseur: Entreprise | null
        matchedRessource: Ressource | null
    }
}

export type MatchReferences = {
    entreprises: readonly Entreprise[]
    ressources: readonly Ressource[]
}

// - - - - - utils - - - - - - //

function toText(value: unknown): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'boolean') return value ? 'True' : 'False'
    if (typeof value === 'number') return String(value)

    if (value instanceof Date) {
        return value.toISOString().slice(0, 19).replace('T', ' ')
    }

    return ''
}

function isTonnage(value: CellValue): value is number {
    return typeof value === 'number' && Number.isFinite(value)
}

export function findSheetName(
    sheetNames: string[],
    expectedSheetName: string
): string | undefined {
    const expected = normalize(expectedSheetName)
    const foundSheetName = sheetNames.find((sheetName) =>
        normalize(sheetName).includes(expected)
    )

    return foundSheetName
}

function readFournisseurSheet(file: ArrayBuffer): CellValue[][] {
    const workbook = XLSX.read(file, { cellDates: false })

    const foundSheetName = findSheetName(
        workbook.SheetNames,
        EXPECTED_WORD_CONTAINED_IN_SHEETNAME
    )

    if (foundSheetName == undefined) {
        throw new Error(
            `la feuille « ${EXPECTED_WORD_CONTAINED_IN_SHEETNAME} » n'existe pas dans le fichier`
        )
    }

    return XLSX.utils.sheet_to_json<CellValue[]>(
        workbook.Sheets[foundSheetName],
        {
            header: 1,
            raw: true,
            defval: null,
            blankrows: true,
        }
    )
}

const mentionsFournisseur = (header: string) =>
    EXPECTED_HEADER_COLUMN_FOURNISSEUR.test(header)

function locateColumns(row: CellValue[]): [ColumnName, number][] {
    const headers = row.map((header) => normalize(toText(header)))

    return [
        ['Fournisseur', headers.findIndex(mentionsFournisseur)],
        ...Object.entries(COLUMN_HEADER_PREFIXES).map(
            ([name, prefix]): [ColumnName, number] => [
                name as ColumnName,
                headers.findIndex((header) => header.startsWith(prefix)),
            ]
        ),
    ]
}

const missingIn = (columns: [ColumnName, number][]) =>
    columns.filter(([, at]) => at === -1).map(([name]) => name)

function findHeaderRow(rows: CellValue[][]): number {
    const candidates = rows
        .slice(0, MAX_ROW_HEADER_SEARCH)
        .map((row, at) => ({ row, at }))
        .filter(({ row }) => mentionsFournisseur(normalize(toText(row[0]))))
        .map(({ row, at }) => ({
            at,
            missing: missingIn(locateColumns(row)).length,
        }))

    if (candidates.length === 0) {
        throw new Error(
            `aucune des ${MAX_ROW_HEADER_SEARCH} premières lignes de la feuille « ${EXPECTED_WORD_CONTAINED_IN_SHEETNAME} » ne porte le mot « fournisseur » dans la colonne A`
        )
    }

    return candidates.reduce((best, candidate) =>
        candidate.missing < best.missing ? candidate : best
    ).at
}

function findColumns(
    rows: CellValue[][],
    headerRow: number
): Record<ColumnName, number> {
    const found = locateColumns(rows[headerRow])
    const missing = missingIn(found)

    if (missing.length > 0) {
        // Spreadsheet rows are numbered from 1; the array is indexed from 0.
        throw new Error(
            `la ligne d'en-tête ${headerRow + 1} de la feuille « ${EXPECTED_WORD_CONTAINED_IN_SHEETNAME} » n'a pas de colonne pour : ${missing.join(', ')}`
        )
    }

    return Object.fromEntries(found) as Record<ColumnName, number>
}

function findAdditionalColumns(
    rows: CellValue[][],
    headerRow: number
): [label: string, at: number][] {
    const headers = rows[headerRow].map((header) => normalize(toText(header)))

    return Object.entries(ADDITIONAL_COLUMN_HEADER_PREFIXES)
        .map(([label, prefix]): [string, number] => [
            label,
            headers.findIndex((header) => header.startsWith(prefix)),
        ])
        .filter(([, at]) => at !== -1)
}

export async function extractRows(
    file: Blob,
    document: string
): Promise<ReadLine[]> {
    const rows = readFournisseurSheet(await file.arrayBuffer())

    const headerRow = findHeaderRow(rows)
    const columns = findColumns(rows, headerRow)
    const additionalColumns = findAdditionalColumns(rows, headerRow)

    const dataRows = rows.slice(headerRow + 1)
    const endsAt = dataRows.findIndex((row) => (row[0] ?? null) === null)
    const table = endsAt === -1 ? dataRows : dataRows.slice(0, endsAt)

    const lines: ReadLine[] = []
    const invalidTonnages: string[] = []

    table.forEach((row, offset) => {
        // Excel numbers rows from 1, and the first data row follows the header.
        const excelRow = headerRow + 2 + offset
        const tonnage = row[columns.Tonnage] ?? null

        if (!isTonnage(tonnage)) {
            invalidTonnages.push(
                `ligne ${excelRow} (${tonnage === null ? 'vide' : `« ${toText(tonnage)} »`})`
            )
            return
        }

        lines.push({
            document,
            excelRow,
            supplier: toText(row[columns.Fournisseur]),
            resource: toText(row[columns.Ressource]),
            tonnage,
            rawProvenance: toText(row[columns.Provenance]),
            additionalData: additionalColumns
                .map(([label, at]) => `${label}: ${toText(row[at])}`)
                .join(', '),
        })
    })

    if (invalidTonnages.length > 0) {
        throw new Error(
            `la colonne « Tonnage » de la feuille « ${EXPECTED_WORD_CONTAINED_IN_SHEETNAME} » doit contenir un nombre : ${invalidTonnages.join(', ')}`
        )
    }

    return lines
}
