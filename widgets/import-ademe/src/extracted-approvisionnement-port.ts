import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'

export type ExtractedApprovisionnementState = 'Importés' | 'Pas importés'

export type StoredExtractedLine = ExtractedLine & {
    id: number
    state: ExtractedApprovisionnementState
    extractedAt: Date
}

export type ExtractedLineChanges = Partial<ExtractedLine['derived']>

export interface ExtractedApprovisionnementPort {
    listByDocument(
        attachment: Pick<Attachment, 'id' | 'name'>
    ): Promise<StoredExtractedLine[]>
    create(
        attachment: Pick<Attachment, 'id'>,
        lines: readonly ExtractedLine[],
        extractedAt: Date
    ): Promise<void>
    update(
        id: StoredExtractedLine['id'],
        changes: ExtractedLineChanges
    ): Promise<void>
    markAsImported(id: StoredExtractedLine['id']): Promise<void>
}
