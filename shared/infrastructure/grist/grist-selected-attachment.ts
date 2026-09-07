import type { RowRecord } from 'grist/GristData'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import { asIdList, asNumber, asString } from './grist-helpers'
import { getAttachmentMetadata } from './grist-attachments'

type Selection = Omit<Attachment, 'name' | 'sizeInBytes'>

export function toSelection(record: RowRecord | null): Selection | null {
    if (record === null) return null

    // A row's cell holds several files while the cursor only picks the row, so
    // the first file is the one meant, as in Grist's own attachment example.
    const [id] = asIdList(record.piece_jointe)
    if (id === undefined) return null

    return {
        id,
        planDApprovisionnement: asNumber(record.Plan_d_approvisionnement) ?? 0,
        type: asString(record.type),
    }
}

/** Reads a `Piece_jointe` row the cursor is on, file name included. */
export async function toSelectedAttachment(
    record: RowRecord | null
): Promise<Attachment | null> {
    const selection = toSelection(record)
    if (selection === null) return null

    const metadata = await getAttachmentMetadata(selection.id)

    return metadata === null ? null : { ...selection, ...metadata }
}
