import type { ImportedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'
import { fakeExtractedLines } from './extracted-lines'

const DELAY_MS = 1300

/**
 * Stands in for importRows, to drive the UI. The outcome follows the
 * document's name, one case per error of the mock-up:
 * - not an .xlsx: unreadable format;
 * - « annexe » or « tableau »: no « Fournisseurs » sheet;
 * - « brive »: no header;
 * - « v2 » or « saillat »: missing columns;
 * - « v1 »: tonnage not a number;
 * - any other .xlsx: the lines of the mock-up.
 */
export function fakeExtractDataFromDocument(
    _file: Blob,
    name: string
): Promise<ImportedLines[]> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const error = fakeError(name)

            if (error) reject(error)
            else resolve(fakeExtractedLines(name))
        }, DELAY_MS)
    })
}

function fakeError(name: string): Error | null {
    const lower = name.toLowerCase()

    if (!lower.endsWith('.xlsx'))
        return new Error(
            `le fichier « ${name} » n'est pas un classeur Excel lisible`
        )
    if (lower.includes('annexe') || lower.includes('tableau'))
        return new Error(
            "la feuille « Fournisseurs » n'existe pas dans le fichier"
        )
    if (lower.includes('brive'))
        return new Error(
            "aucune des 40 premières lignes de la feuille « Fournisseurs » ne porte l'en-tête « Fournisseur » dans la colonne A"
        )
    if (lower.includes('v2') || lower.includes('saillat'))
        return new Error(
            "la ligne d'en-tête 16 de la feuille « Fournisseurs » n'a pas de colonne pour : Ressource, Provenance"
        )
    if (lower.includes('v1'))
        return new Error(
            'la colonne « Tonnage » de la feuille « Fournisseurs » doit contenir un nombre : ligne 19 (« 1 200 t »), ligne 23 (vide)'
        )

    return null
}
