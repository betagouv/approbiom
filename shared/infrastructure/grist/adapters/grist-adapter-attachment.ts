import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import { gristReady } from '../grist-ready'
import { asIdList, asNumber, asString, fetchRowsOnce } from '../grist-helpers'
import { getAttachmentsMetadata } from '../grist-attachments'
import { getAccessToken } from '../grist-get-access-token'
import { COLUMNS, TABLE } from '../grist-tables'

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

        async getFileUrl(id) {
            const { baseUrl, token } = await getAccessToken()

            return `${baseUrl}/attachments/${id}/download?auth=${token}`
        },
    }
}
