import type { Attachment } from '@shared/application/domain/attachment'

export interface AttachmentQuery {
    list(): Promise<readonly Attachment[]>
    getFileUrl(id: Attachment['id']): Promise<string>
}
