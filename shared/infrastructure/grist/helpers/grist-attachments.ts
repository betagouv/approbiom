import type { AccessTokenResult } from 'grist/GristAPI'
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

async function fetchMetadata(
    { baseUrl, token }: AccessTokenResult,
    id: number
): Promise<AttachmentMetadata | null> {
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
    const missing = ids.filter((id) => !metadata.has(id))
    const credentials = missing.length > 0 ? await getAccessToken() : null
    const fetched = credentials
        ? await Promise.all(
              missing.map(
                  async (id) =>
                      [id, await fetchMetadata(credentials, id)] as const
              )
          )
        : []

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
