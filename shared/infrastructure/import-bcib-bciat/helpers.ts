import * as XLSX from 'xlsx'

// - - - - - Configurations - - - - - - //

// Workbook structure

const SHEET_NAME = 'Fournisseurs'
const HEADER_COLUMN_FOURNISSEURS = 'Fournisseur'

// How far down to look for the header row. It sits on row 11, 16 or 18
// depending on which year's template the plan was written on.
const MAX_ROW_HEADER_SEARCH = 40

const COLUMN_HEADER_PREFIXES: Record<string, string> = {
    Fournisseur: 'fournisseur',
    Ressource: 'sous categorie',
    Tonnage: 'tonnage',
    Provenance: 'repartition approximative',
}

// - - - - - Functions - - - - - - //

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

function readGrid(workbook: XLSX.WorkBook, sheetName: string): unknown[][] {
    return XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
        header: 1,
        raw: true,
        defval: null,
        blankrows: true,
    })
}

export async function getHasExpectedTemplate(file: Blob): Promise<boolean> {
    const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: false })

    if (!workbook.SheetNames.includes(SHEET_NAME)) {
        throw new Error(
            `la feuille « ${SHEET_NAME} » n'existe pas dans le fichier`
        )
    }

    const rows = readGrid(workbook, SHEET_NAME)

    // Only an exact match counts: the sheet is titled "Fournisseurs" on row 1
    // and talks about a "Vérification tonnage Fournisseur" above the table, and
    // neither of those is the header.
    const indexRowHeaders = rows
        .slice(0, MAX_ROW_HEADER_SEARCH)
        .findIndex(
            (row) =>
                typeof row[0] === 'string' &&
                row[0].trim() === HEADER_COLUMN_FOURNISSEURS
        )

    if (indexRowHeaders === -1) {
        throw new Error(
            `aucune des ${MAX_ROW_HEADER_SEARCH} premières lignes de la feuille « ${SHEET_NAME} » ne porte l'en-tête « ${HEADER_COLUMN_FOURNISSEURS} » dans la colonne A`
        )
    }

    const headers = rows[indexRowHeaders].map((header) =>
        normalize(toText(header))
    )

    const missing = Object.entries(COLUMN_HEADER_PREFIXES)
        .filter(([, prefix]) =>
            headers.every((header) => !header.startsWith(prefix))
        )
        .map(([name]) => name)

    if (missing.length > 0) {
        // Python numbers rows from 1; the array is indexed from 0.
        throw new Error(
            `la ligne d'en-tête ${indexRowHeaders + 1} de la feuille « ${SHEET_NAME} » n'a pas de colonne pour : ${missing.join(', ')}`
        )
    }

    return true
}
