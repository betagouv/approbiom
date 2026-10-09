import { describe, expect, it } from 'vitest'
import { createFakeExtractedApprovisionnements } from './extracted-approvisionnements'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type { ExtractedLine } from '@shared/core/domain/entities/extracted-approvisionnement'

const DOCUMENT = { id: 20, name: 'plan.xlsx' }
const EXTRACTED_AT = new Date('2026-10-09T10:00:00')

const line = (excelRow: number): ExtractedLine => ({
    read: {
        document: DOCUMENT.name,
        excelRow,
        supplier: 'Scierie',
        resource: 'Plaquettes',
        tonnage: 100,
        rawProvenance: 'Corrèze',
        additionalData: '',
    },
    derived: {
        parsedProvenance: {
            distribution: [],
            confidence: 'Explicite',
            unrecognized: [],
        },
        matchedFournisseur: null,
        matchedRessource: null,
    },
})

async function extracted() {
    const port = createFakeExtractedApprovisionnements()
    await port.create(DOCUMENT, [line(17), line(18)], EXTRACTED_AT)

    return port
}

describe('createFakeExtractedApprovisionnements', () => {
    it('extracts the lines « Non vérifiée »', async () => {
        const port = await extracted()

        const lines = await port.listByDocument(DOCUMENT)

        expect(lines.map(({ controle }) => controle)).toEqual([
            NON_VERIFIEE,
            NON_VERIFIEE,
        ])
    })

    it('counts the lines verified', async () => {
        const port = await extracted()
        const [first] = await port.listByDocument(DOCUMENT)

        await port.update(first.id, { controle: VERIFIEE })

        expect(await port.listSummaries()).toEqual([
            {
                attachmentId: DOCUMENT.id,
                extractedAt: EXTRACTED_AT,
                lineCount: 2,
                verifiedCount: 1,
            },
        ])
    })

    it('keeps the controle when only the match changes', async () => {
        const port = await extracted()
        const [first] = await port.listByDocument(DOCUMENT)
        await port.update(first.id, { controle: VERIFIEE })

        await port.update(first.id, { matchedFournisseur: null })

        expect((await port.listByDocument(DOCUMENT))[0].controle).toBe(VERIFIEE)
    })

    it('drops the lines imported', async () => {
        const port = await extracted()
        const [first, second] = await port.listByDocument(DOCUMENT)

        await port.deleteLines([first.id])

        expect(
            (await port.listByDocument(DOCUMENT)).map(({ id }) => id)
        ).toEqual([second.id])
    })

    it('summarises nothing once every line is imported', async () => {
        const port = await extracted()
        const lines = await port.listByDocument(DOCUMENT)

        await port.deleteLines(lines.map(({ id }) => id))

        expect(await port.listSummaries()).toEqual([])
    })

    it('forgets what was extracted from a document', async () => {
        const port = await extracted()

        await port.deleteByDocument(DOCUMENT)

        expect(await port.listByDocument(DOCUMENT)).toEqual([])
        expect(await port.listSummaries()).toEqual([])
    })
})
