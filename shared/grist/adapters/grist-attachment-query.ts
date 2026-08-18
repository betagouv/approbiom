import type { AttachmentQuery } from '@shared/core/application/ports/attachment'
import { gristReady } from '../grist-ready'
import { asIdList, asNumber, asString, fetchRowsOnce } from '../grist-helpers'
import { COLUMNS, TABLE } from '../grist-tables'

type AttachmentMetadata = {
    name: string
    sizeInBytes: number
}

async function getAccessToken() {
    await gristReady()

    return grist.docApi.getAccessToken({ readOnly: true })
}

async function fetchMetadata(
    ids: readonly number[]
): Promise<Map<number, AttachmentMetadata>> {
    if (ids.length === 0) return new Map()

    const { baseUrl, token } = await getAccessToken()

    const files = await Promise.all(
        ids.map(async (id) => {
            const response = await fetch(
                `${baseUrl}/attachments/${id}?auth=${token}`
            )

            // A cell still naming a file the document no longer stores. There
            // is nothing to show for it and nothing to hand over.
            if (response.status === 404) return null

            if (!response.ok) {
                throw new Error(
                    `Grist attachment ${id} could not be read — ${response.status} ${response.statusText}. `
                )
            }

            const { fileName, fileSize } = (await response.json()) as {
                fileName?: unknown
                fileSize?: unknown
            }

            return [
                id,
                {
                    name: asString(fileName),
                    sizeInBytes: asNumber(fileSize) ?? 0,
                },
            ] as const
        })
    )

    return new Map(files.filter((file) => file !== null))
}

export function createGristAttachmentQuery(): AttachmentQuery {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.attachment,
                COLUMNS.attachment
            )

            // One row carries a whole cell of files, all filed under the same
            // type — the domain holds one file each, so the cell is spread out
            // here rather than by every screen that lists one.
            const attached = rows.flatMap((row) =>
                asIdList(row.piece_jointe).map((id) => ({
                    id,
                    planDApprovisionnement:
                        asNumber(row.Plan_d_approvisionnement) ?? 0,
                    type: asString(row.type),
                }))
            )

            const metadata = await fetchMetadata([
                ...new Set(attached.map(({ id }) => id)),
            ])

            return attached.flatMap((attachment) => {
                const file = metadata.get(attachment.id)

                return file === undefined ? [] : { ...attachment, ...file }
            })
        },

        async getFileUrl(id) {
            const { baseUrl, token } = await getAccessToken()

            return `${baseUrl}/attachments/${id}/download?auth=${token}`
        },
    }
}
