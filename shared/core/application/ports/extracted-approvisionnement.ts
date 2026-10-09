import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Controle } from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type {
    ExtractedApprovisionnement,
    ExtractedLine,
} from '@shared/core/domain/entities/extracted-approvisionnement'

export type ExtractionSummary = {
    attachmentId: Attachment['id']
    // Null for a document never extracted.
    extractedAt: Date | null
    lineCount: number
    verifiedCount: number
}

export type ExtractedLineChanges = Partial<ExtractedLine['derived']> & {
    controle?: Controle
}

export interface ExtractedApprovisionnementPort {
    listByDocument(
        attachment: Pick<Attachment, 'id' | 'name'>
    ): Promise<ExtractedApprovisionnement[]>
    listSummaries(): Promise<ExtractionSummary[]>
    create(
        attachment: Pick<Attachment, 'id'>,
        lines: readonly ExtractedLine[],
        extractedAt: Date
    ): Promise<void>
    update(
        id: ExtractedApprovisionnement['id'],
        changes: ExtractedLineChanges
    ): Promise<void>
    deleteByDocument(attachment: Pick<Attachment, 'id'>): Promise<void>
    deleteLines(ids: readonly ExtractedApprovisionnement['id'][]): Promise<void>
}
