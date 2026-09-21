import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import { gristReady } from '../helpers/grist-ready'
import {
    asIdList,
    asNumber,
    asString,
    fetchRowsOnce,
} from '../helpers/grist-helpers'
import {
    getAttachmentMetadata,
    getAttachmentsMetadata,
} from '../helpers/grist-attachments'
import { getAccessToken } from '../helpers/grist-get-access-token'
import { COLUMNS, TABLE } from '../types/grist-tables'

export function createGristAttachmentPort(): AttachmentPort {
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

            const metadata = await getAttachmentsMetadata([
                ...new Set(attached.map(({ id }) => id)),
            ])

            return attached.flatMap((attachment) => {
                const file = metadata.get(attachment.id)

                return file === undefined ? [] : { ...attachment, ...file }
            })
        },

        async findOne(id) {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.attachment,
                COLUMNS.attachment
            )

            const row = rows.find((row) =>
                asIdList(row.piece_jointe).includes(id)
            )

            if (row === undefined) {
                throw new Error(
                    `Grist attachment ${id} is named by no "${TABLE.attachment}" row — check it still exists in the document. `
                )
            }

            const file = await getAttachmentMetadata(id)

            if (file === null) {
                throw new Error(
                    `Grist attachment ${id} is named by a row but the document no longer stores the file. `
                )
            }

            return {
                id,
                planDApprovisionnement:
                    asNumber(row.Plan_d_approvisionnement) ?? 0,
                type: asString(row.type),
                ...file,
            }
        },

        async getFileUrl(id) {
            const { baseUrl, token } = await getAccessToken()

            return `${baseUrl}/attachments/${id}/download?auth=${token}`
        },
    }
}
