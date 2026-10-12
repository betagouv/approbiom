import { METADATA_TABLE } from '../types/grist-tables'
import { getAccessToken } from './grist-get-access-token'
import { asNumber, asString, fetchRowsOnce } from './grist-helpers'

export type AttachmentMetadata = {
    name: string
    sizeInBytes: number
}

async function readAllMetadata(): Promise<Map<number, AttachmentMetadata>> {
    const rows = await fetchRowsOnce(
        METADATA_TABLE.gristAttachment.id,
        METADATA_TABLE.gristAttachment.columnIds
    )

    return new Map(
        rows.map((row) => [
            asNumber(row.id) ?? 0,
            {
                name: asString(row.fileName),
                sizeInBytes: asNumber(row.fileSize) ?? 0,
            },
        ])
    )
}

async function fetchMetadata(id: number): Promise<AttachmentMetadata | null> {
    const { baseUrl, token } = await getAccessToken()
    const response = await fetch(`${baseUrl}/attachments/${id}?auth=${token}`)
    if (!response.ok) return null

    const { fileName, fileSize } = (await response.json()) as {
        fileName?: unknown
        fileSize?: unknown
    }

    return { name: asString(fileName), sizeInBytes: asNumber(fileSize) ?? 0 }
}

export async function getAttachmentMetadata(
    id: number
): Promise<AttachmentMetadata | null> {
    return (await getAttachmentsMetadata([id])).get(id) ?? null
}

export async function getAttachmentsMetadata(
    ids: readonly number[]
): Promise<Map<number, AttachmentMetadata>> {
    if (ids.length === 0) return new Map()

    const metadata = await readAllMetadata()
    const fetched = await Promise.all(
        ids
            .filter((id) => !metadata.has(id))
            .map(async (id) => [id, await fetchMetadata(id)] as const)
    )

    return new Map([
        ...ids.flatMap((id) => {
            const file = metadata.get(id)

            return file === undefined ? [] : [[id, file] as const]
        }),
        ...fetched.flatMap(([id, file]) =>
            file === null ? [] : [[id, file] as const]
        ),
    ])
}
