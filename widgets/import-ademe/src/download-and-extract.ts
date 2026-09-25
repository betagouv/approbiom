import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ImportedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'

export type DownloadAndExtractDependencies = {
    getFileUrl: AttachmentPort['getFileUrl']
    extractDataFromDocument: (
        file: Blob,
        document: Attachment['name']
    ) => Promise<ImportedLines[]>
}

export async function downloadAndExtract(
    attachment: Pick<Attachment, 'id' | 'name'>,
    { getFileUrl, extractDataFromDocument }: DownloadAndExtractDependencies
): Promise<ImportedLines[]> {
    const response = await fetch(await getFileUrl(attachment.id))

    if (!response.ok) {
        throw new Error(
            `le téléchargement du fichier a échoué (${response.status} ${response.statusText})`
        )
    }

    const file = await response.blob()

    try {
        return await extractDataFromDocument(file, attachment.name)
    } catch (cause) {
        throw new Error(
            `Un problème est survenu : ${
                cause instanceof Error ? cause.message : String(cause)
            }`,
            { cause }
        )
    }
}
