import { METADATA_TABLE } from '../types/grist-tables'
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

export async function getAttachmentMetadata(
    id: number
): Promise<AttachmentMetadata | null> {
    return (await readAllMetadata()).get(id) ?? null
}

export async function getAttachmentsMetadata(
    ids: readonly number[]
): Promise<Map<number, AttachmentMetadata>> {
    if (ids.length === 0) return new Map()

    const metadata = await readAllMetadata()

    return new Map(
        ids.flatMap((id) => {
            const file = metadata.get(id)

            return file === undefined ? [] : [[id, file] as const]
        })
    )
}
