import { describe, expect, it, vi } from 'vitest'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import { extractDocument } from './extract-document'
import { createFakeExtractedApprovisionnements } from './fake-data/extracted-approvisionnements'

const attachment = { id: 1, name: 'plan.xlsx' }

const line: ExtractedLine = {
    read: {
        document: 'plan.xlsx',
        excelRow: 17,
        supplier: 'SCIERIE FICTIVE DU VALLON',
        resource: 'Ecorces',
        tonnage: 650,
        rawProvenance: '',
        additionalData: '',
    },
    derived: {
        parsedProvenance: {
            distribution: [],
            confidence: 'Non résolu',
            unrecognized: [],
        },
        matchedFournisseur: null,
        matchedRessource: null,
    },
}

describe('extractDocument', () => {
    it('extracts a document not in the table yet, then reads it back', async () => {
        const extractedApprovisionnements =
            createFakeExtractedApprovisionnements()
        const downloadAndExtract = vi.fn(() => Promise.resolve([line]))

        const { lines } = await extractDocument(attachment, {
            extractedApprovisionnements,
            downloadAndExtract,
        })

        expect(downloadAndExtract).toHaveBeenCalledOnce()
        expect(lines).toMatchObject([{ state: 'Pas créés', read: line.read }])
    })

    it('reads back a document already in the table, without extracting it again', async () => {
        const extractedApprovisionnements =
            createFakeExtractedApprovisionnements()
        const extractedAt = new Date('2026-09-20')
        await extractedApprovisionnements.create(
            attachment,
            [line],
            extractedAt
        )
        const downloadAndExtract = vi.fn(() => Promise.resolve([line]))

        const extracted = await extractDocument(attachment, {
            extractedApprovisionnements,
            downloadAndExtract,
        })

        expect(downloadAndExtract).not.toHaveBeenCalled()
        expect(extracted.lines).toHaveLength(1)
        expect(extracted.date).toEqual(extractedAt)
    })

    it('writes the lines once when asked twice at the same time', async () => {
        const extractedApprovisionnements =
            createFakeExtractedApprovisionnements()
        const downloadAndExtract = vi.fn(() => Promise.resolve([line]))
        const dependencies = { extractedApprovisionnements, downloadAndExtract }

        await Promise.all([
            extractDocument(attachment, dependencies),
            extractDocument(attachment, dependencies),
        ])

        expect(downloadAndExtract).toHaveBeenCalledOnce()
        expect(
            await extractedApprovisionnements.listByDocument(attachment)
        ).toHaveLength(1)
    })
})
