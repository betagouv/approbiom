import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'

export type ExtractedApprovisionnementState = 'Importés' | 'Pas importés'

export type StoredExtractedLine = ExtractedLine & {
    id: number
    state: ExtractedApprovisionnementState
    extractedAt: Date
}

export type ExtractionSummary = {
    attachmentId: Attachment['id']
    extractedAt: Date
    lineCount: number
    importedCount: number
}

export type ExtractedLineChanges = Partial<ExtractedLine['derived']>

export interface ExtractedApprovisionnementPort {
    listByDocument(
        attachment: Pick<Attachment, 'id' | 'name'>
    ): Promise<StoredExtractedLine[]>
    listSummaries(): Promise<ExtractionSummary[]>
    create(
        attachment: Pick<Attachment, 'id'>,
        lines: readonly ExtractedLine[],
        extractedAt: Date
    ): Promise<void>
    update(
        id: StoredExtractedLine['id'],
        changes: ExtractedLineChanges
    ): Promise<void>
}
