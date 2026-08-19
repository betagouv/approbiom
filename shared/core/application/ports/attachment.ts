import type { Attachment } from '@shared/core/domain/entities/attachment'

export interface AttachmentPort {
    list(): Promise<readonly Attachment[]>
    getFileUrl(id: Attachment['id']): Promise<string>
}
