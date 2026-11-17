import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import { gristReady } from '../helpers/grist-ready'
import {
    asIdList,
    asNumber,
    asString,
    fetchRowsOnce,
    type GristRow,
} from '../helpers/grist-helpers'
import { getAttachmentsMetadata } from '../helpers/grist-attachments'
import { getAccessToken } from '../helpers/grist-get-access-token'
import { COLUMNS, TABLE } from '../types/grist-tables'

async function getFileUrl(id: number) {
    const { baseUrl, token } = await getAccessToken()

    return `${baseUrl}/attachments/${id}/download?auth=${token}`
}

// One row carries a whole cell of files, all filed under the same type — the
// domain holds one file each, so the cell is spread out here rather than by
// every screen that lists one.
async function attachmentsOf(rows: readonly GristRow[]): Promise<Attachment[]> {
    const attached = rows.flatMap((row) =>
        asIdList(row.piece_jointe).map((id) => ({
            id,
            planDApprovisionnement: asNumber(row.Plan_d_approvisionnement) ?? 0,
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
}

export function createGristAttachmentPort(): AttachmentPort {
    return {
        async listByPlan(plan) {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.attachment,
                COLUMNS.attachment
            )

            return attachmentsOf(
                rows.filter(
                    (row) => asNumber(row.Plan_d_approvisionnement) === plan
                )
            )
        },

        getFileUrl,

        async download(id) {
            const response = await fetch(await getFileUrl(id))
            if (!response.ok) {
                throw new Error(
                    `le téléchargement du fichier a échoué (${response.status} ${response.statusText})`
                )
            }

            return response.blob()
        },
    }
}
