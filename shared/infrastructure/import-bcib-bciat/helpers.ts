import * as XLSX from 'xlsx'

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

export type CellValue = string | number | boolean | null

export type ExtractedLines = {
    document: string
    ligneExcel: number
    fournisseur: CellValue
    ressource: CellValue
    tonnage: CellValue
    provenanceBrute: CellValue
}

// - - - - - utils - - - - - - //

function normalize(text: string): string {
    // Decimal percentages first, while the comma is still there to tell them
    // apart: without this "33,5%" would become "33 5%", which reads as "5%".
    const withDecimals = text.replace(/(\d+)[.,](\d+)(\s*%)/g, '$1.$2$3')

    const withoutAccents = withDecimals.normalize('NFD').replace(/\p{M}/gu, '')

    const kept = withoutAccents.toLowerCase().replace(/[^a-z0-9%.]/g, ' ')

    // A dot only ever meant something between two digits.
    const withoutStrayDots = kept.replace(/(?<![0-9])\.|\.(?![0-9])/g, ' ')

    return withoutStrayDots.split(/\s+/).filter(Boolean).join(' ')
}

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
        // Python numbers rows from 1; the array is indexed from 0.
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

    return table.map((row, offset) => ({
        document,
        // Excel numbers rows from 1, and the first data row follows the header.
        ligneExcel: headerRow + 2 + offset,
        fournisseur: row[columns.Fournisseur] ?? null,
        ressource: row[columns.Ressource] ?? null,
        tonnage: row[columns.Tonnage] ?? null,
        provenanceBrute: row[columns.Provenance] ?? null,
    }))
}
