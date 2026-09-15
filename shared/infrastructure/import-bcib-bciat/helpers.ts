import * as XLSX from 'xlsx'
import {
    loadReferenceData,
    normalize,
} from './transform-provenance/reference-data'
import {
    transformProvenance,
    type Confidence,
    type ProvenanceShare,
} from './transform-provenance/transform-provenance'
import type { CellValue } from 'grist/GristData'

// - - - - - Configurations - - - - - - //

// Input - Workbook structure

const SHEET_NAME = 'Fournisseurs'
const HEADER_COLUMN_FOURNISSEURS = 'Fournisseur'

const COLUMN_HEADER_PREFIXES = {
    Fournisseur: 'fournisseur',
    Ressource: 'sous categorie',
    Tonnage: 'tonnage',
    Provenance: 'repartition approximative',
} as const

// How far down to look for the header row. It sits on row 11, 16 or 18
// depending on which year's template the plan was written on.
const MAX_ROW_HEADER_SEARCH = 40

// Output

type ColumnName = keyof typeof COLUMN_HEADER_PREFIXES

export type ExtractedLines = {
    document: string
    excelRow: number
    supplier: string
    resource: string
    tonnage: number
    rawProvenance: string
}

export type ImportedLines = ExtractedLines & {
    provenance: ProvenanceShare[]
    confidence: Confidence
    unrecognized: string[]
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

function readSheet(file: ArrayBuffer): CellValue[][] {
    const workbook = XLSX.read(file, { cellDates: false })

    if (!workbook.SheetNames.includes(SHEET_NAME)) {
        throw new Error(
            `la feuille « ${SHEET_NAME} » n'existe pas dans le fichier`
        )
    }

    return XLSX.utils.sheet_to_json<CellValue[]>(workbook.Sheets[SHEET_NAME], {
        header: 1,
        raw: true,
        defval: null,
        blankrows: true,
    })
}

function findHeaderRow(rows: CellValue[][]): number {
    const at = rows
        .slice(0, MAX_ROW_HEADER_SEARCH)
        .findIndex(
            (row) =>
                typeof row[0] === 'string' &&
                row[0].trim() === HEADER_COLUMN_FOURNISSEURS
        )

    if (at === -1) {
        throw new Error(
            `aucune des ${MAX_ROW_HEADER_SEARCH} premières lignes de la feuille « ${SHEET_NAME} » ne porte l'en-tête « ${HEADER_COLUMN_FOURNISSEURS} » dans la colonne A`
        )
    }

    return at
}

function findColumns(
    rows: CellValue[][],
    headerRow: number
): Record<ColumnName, number> {
    const headers = rows[headerRow].map((header) => normalize(toText(header)))

    const found = Object.entries(COLUMN_HEADER_PREFIXES).map(
        ([name, prefix]) =>
            [
                name as ColumnName,
                headers.findIndex((header) => header.startsWith(prefix)),
            ] as const
    )

    const missing = found.filter(([, at]) => at === -1).map(([name]) => name)

    if (missing.length > 0) {
        // Spreadsheet rows are numbered from 1; the array is indexed from 0.
        throw new Error(
            `la ligne d'en-tête ${headerRow + 1} de la feuille « ${SHEET_NAME} » n'a pas de colonne pour : ${missing.join(', ')}`
        )
    }

    return Object.fromEntries(found) as Record<ColumnName, number>
}

// - - - - - exported functions - - - - - - //

export async function getHasExpectedTemplate(file: Blob): Promise<boolean> {
    const rows = readSheet(await file.arrayBuffer())

    findColumns(rows, findHeaderRow(rows))

    return true
}

export async function extractRows(
    file: Blob,
    document: string
): Promise<ExtractedLines[]> {
    const rows = readSheet(await file.arrayBuffer())

    const headerRow = findHeaderRow(rows)
    const columns = findColumns(rows, headerRow)

    const dataRows = rows.slice(headerRow + 1)
    const endsAt = dataRows.findIndex((row) => (row[0] ?? null) === null)
    const table = endsAt === -1 ? dataRows : dataRows.slice(0, endsAt)

    const lines: ExtractedLines[] = []
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
        })
    })

    if (invalidTonnages.length > 0) {
        throw new Error(
            `la colonne « Tonnage » de la feuille « ${SHEET_NAME} » doit contenir un nombre : ${invalidTonnages.join(', ')}`
        )
    }

    return lines
}

export async function importRows(
    file: Blob,
    document: string
): Promise<ImportedLines[]> {
    const reference = loadReferenceData()

    return (await extractRows(file, document)).map((line) => {
        const { distribution, confidence, unrecognized } = transformProvenance(
            line.rawProvenance,
            reference
        )

        return {
            ...line,
            provenance: distribution,
            confidence,
            unrecognized,
        }
    })
}
