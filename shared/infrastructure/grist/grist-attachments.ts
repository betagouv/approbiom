import type { AccessTokenResult } from 'grist/GristAPI'

import { asNumber, asString } from './grist-helpers'
import { getAccessToken } from './grist-get-access-token'

export type AttachmentMetadata = {
    name: string
    sizeInBytes: number
}
async function readMetadata(
    { baseUrl, token }: AccessTokenResult,
    id: number
): Promise<AttachmentMetadata | null> {
    const response = await fetch(`${baseUrl}/attachments/${id}?auth=${token}`)

    if (!response.ok) {
        throw new Error(
            `Grist attachment ${id} could not be read — ${response.status} ${response.statusText}. `
        )
    }

    const { fileName, fileSize } = (await response.json()) as {
        fileName?: unknown
        fileSize?: unknown
    }

    return {
        name: asString(fileName),
        sizeInBytes: asNumber(fileSize) ?? 0,
    }
}

export async function getAttachmentMetadata(
    id: number
): Promise<AttachmentMetadata | null> {
    return readMetadata(await getAccessToken(), id)
}

export async function getAttachmentsMetadata(
    ids: readonly number[]
): Promise<Map<number, AttachmentMetadata>> {
    if (ids.length === 0) return new Map()

    const credentials = await getAccessToken()

    const files = await Promise.all(
        ids.map(async (id) => {
            const metadata = await readMetadata(credentials, id)

            return metadata === null ? null : ([id, metadata] as const)
        })
    )

    return new Map(files.filter((file) => file !== null))
}
