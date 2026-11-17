import type { Attachment } from '@shared/core/domain/entities/attachment'

export interface AttachmentPort {
    listByPlan(
        plan: Attachment['planDApprovisionnement']
    ): Promise<readonly Attachment[]>
    getFileUrl(id: Attachment['id']): Promise<string>
    download(id: Attachment['id']): Promise<Blob>
}
