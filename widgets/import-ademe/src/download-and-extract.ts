import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { RessourcePort } from '@shared/core/application/ports/ressource'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type {
    ExtractedLine,
    MatchReferences,
} from '@shared/infrastructure/import-bcib-bciat/helpers'

export type DownloadAndExtractDependencies = {
    getFileUrl: AttachmentPort['getFileUrl']
    extractDataFromDocument: (
        file: Blob,
        document: Attachment['name'],
        references: MatchReferences
    ) => Promise<ExtractedLine[]>
    listEntreprises: EntreprisePort['list']
    listRessources: RessourcePort['list']
}

export async function downloadAndExtract(
    attachment: Pick<Attachment, 'id' | 'name'>,
    {
        getFileUrl,
        extractDataFromDocument,
        listEntreprises,
        listRessources,
    }: DownloadAndExtractDependencies
): Promise<ExtractedLine[]> {
    const [response, entreprises, ressources] = await Promise.all([
        getFileUrl(attachment.id).then((url) => fetch(url)),
        listEntreprises(),
        listRessources(),
    ])

    if (!response.ok) {
        throw new Error(
            `le téléchargement du fichier a échoué (${response.status} ${response.statusText})`
        )
    }

    const file = await response.blob()

    try {
        return await extractDataFromDocument(file, attachment.name, {
            entreprises,
            ressources,
        })
    } catch (cause) {
        throw new Error(
            `Un problème est survenu : ${
                cause instanceof Error ? cause.message : String(cause)
            }`,
            { cause }
        )
    }
}
