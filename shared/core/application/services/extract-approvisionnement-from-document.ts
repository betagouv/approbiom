import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { DocumentExtractorApprovisionnementPort } from '@shared/core/application/ports/document-extractor-approvisionnement'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { ExtractedApprovisionnementPort } from '@shared/core/application/ports/extracted-approvisionnement'
import type { RessourcePort } from '@shared/core/application/ports/ressource'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type {
    ExtractedApprovisionnement,
    ExtractedLine,
} from '@shared/core/domain/entities/extracted-approvisionnement'

export type ExtractedDocument = {
    lines: readonly ExtractedApprovisionnement[]
    date: Date
}

export type ExtractApprovisionnementFromDocumentPorts = {
    extractedApprovisionnements: ExtractedApprovisionnementPort
    attachments: Pick<AttachmentPort, 'download'>
    entreprises: Pick<EntreprisePort, 'list'>
    ressources: Pick<RessourcePort, 'list'>
    documentExtractorApprovisionnement: DocumentExtractorApprovisionnementPort
}

type Document = Pick<Attachment, 'id' | 'name'>

export async function extractApprovisionnementFromDocument(
    attachment: Document,
    ports: ExtractApprovisionnementFromDocumentPorts
): Promise<ExtractedDocument> {
    const { extractedApprovisionnements } = ports
    const stored = await extractedApprovisionnements.listByDocument(attachment)
    if (stored.length > 0) return { lines: stored, date: stored[0].extractedAt }

    const extractedAt = new Date()
    await extractedApprovisionnements.create(
        attachment,
        await downloadAndExtract(attachment, ports),
        extractedAt
    )

    return {
        lines: await extractedApprovisionnements.listByDocument(attachment),
        date: extractedAt,
    }
}

async function downloadAndExtract(
    attachment: Document,
    {
        attachments,
        entreprises,
        ressources,
        documentExtractorApprovisionnement,
    }: ExtractApprovisionnementFromDocumentPorts
): Promise<ExtractedLine[]> {
    const [file, entrepriseList, ressourceList] = await Promise.all([
        attachments.download(attachment.id),
        entreprises.list(),
        ressources.list(),
    ])

    try {
        return await documentExtractorApprovisionnement.extract(
            file,
            attachment.name,
            {
                entreprises: entrepriseList,
                ressources: ressourceList,
            }
        )
    } catch (cause) {
        throw new Error(
            `Un problème est survenu : ${
                cause instanceof Error ? cause.message : String(cause)
            }`,
            { cause }
        )
    }
}
