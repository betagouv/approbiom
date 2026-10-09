import { describe, expect, it, vi } from 'vitest'
import type { ExtractedApprovisionnementPort } from '@shared/core/application/ports/extracted-approvisionnement'
import type {
    ExtractedApprovisionnement,
    ExtractedLine,
} from '@shared/core/domain/entities/extracted-approvisionnement'
import { NON_VERIFIEE } from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import { extractApprovisionnementFromDocument } from './extract-approvisionnement-from-document'

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

function inMemoryExtractedApprovisionnements(): ExtractedApprovisionnementPort {
    let stored: ExtractedApprovisionnement[] = []

    return {
        listByDocument: () => Promise.resolve(stored),
        listSummaries: () => Promise.resolve([]),
        create: (_, lines, extractedAt) => {
            stored = [
                ...stored,
                ...lines.map((created, index) => ({
                    ...created,
                    id: stored.length + index + 1,
                    controle: NON_VERIFIEE,
                    extractedAt,
                })),
            ]

            return Promise.resolve()
        },
        update: () => Promise.resolve(),
        deleteByDocument: () => Promise.resolve(),
        deleteLines: () => Promise.resolve(),
    }
}

function ports(
    extractedApprovisionnements = inMemoryExtractedApprovisionnements()
) {
    return {
        extractedApprovisionnements,
        attachments: { download: vi.fn(() => Promise.resolve(new Blob())) },
        entreprises: { list: () => Promise.resolve([]) },
        ressources: { list: () => Promise.resolve([]) },
        documentExtractorApprovisionnement: {
            extract: vi.fn(() => Promise.resolve([line])),
        },
    }
}

describe('extractApprovisionnementFromDocument', () => {
    it('extracts a document not in the table yet, then reads it back', async () => {
        const dependencies = ports()

        const { lines } = await extractApprovisionnementFromDocument(
            attachment,
            dependencies
        )

        expect(dependencies.attachments.download).toHaveBeenCalledWith(1)
        expect(
            dependencies.documentExtractorApprovisionnement.extract
        ).toHaveBeenCalledOnce()
        expect(lines).toMatchObject([
            { controle: NON_VERIFIEE, read: line.read },
        ])
    })

    it('reads back a document already in the table, without extracting it again', async () => {
        const dependencies = ports()
        const extractedAt = new Date('2026-09-20')
        await dependencies.extractedApprovisionnements.create(
            attachment,
            [line],
            extractedAt
        )

        const extracted = await extractApprovisionnementFromDocument(
            attachment,
            dependencies
        )

        expect(
            dependencies.documentExtractorApprovisionnement.extract
        ).not.toHaveBeenCalled()
        expect(extracted.lines).toHaveLength(1)
        expect(extracted.date).toEqual(extractedAt)
    })

    it('says what went wrong in the extraction', async () => {
        const dependencies = ports()
        dependencies.documentExtractorApprovisionnement.extract.mockRejectedValue(
            new Error('Feuille « Fournisseurs » introuvable')
        )

        await expect(
            extractApprovisionnementFromDocument(attachment, dependencies)
        ).rejects.toThrow(
            'Un problème est survenu : Feuille « Fournisseurs » introuvable'
        )
    })
})
