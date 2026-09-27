import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'

export type ExtractedApprovisionnementState = 'Importés' | 'Pas importés'

export type StoredExtractedLine = ExtractedLine & {
    id: number
    state: ExtractedApprovisionnementState
    extractedAt: Date
}

export interface ExtractedApprovisionnementPort {
    listByDocument(
        attachment: Pick<Attachment, 'id' | 'name'>
    ): Promise<StoredExtractedLine[]>
    create(
        attachment: Pick<Attachment, 'id'>,
        lines: readonly ExtractedLine[],
        extractedAt: Date
    ): Promise<void>
}
