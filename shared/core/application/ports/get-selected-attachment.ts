import type { Attachment } from '@shared/core/domain/entities/attachment'

export type GetSelectedAttachment = (
    onChange: (attachment: Attachment | null) => void,
    onError: (error: Error) => void
) => () => void
