type AttachmentIds = number[]

export type GristAttachmentRecord = {
    id: number
    Plan_d_approvisionnement: string
    piece_jointe: AttachmentIds | null
    type: string
}

function isAttachmentIds(value: unknown): value is AttachmentIds {
    return Array.isArray(value) && value.every((id) => typeof id === 'number')
}

export function isGristAttachmentRecord(
    record: unknown
): record is GristAttachmentRecord {
    if (typeof record !== 'object' || record === null) return false

    const { id, Plan_d_approvisionnement, piece_jointe, type } =
        record as GristAttachmentRecord

    return (
        typeof id === 'number' &&
        typeof Plan_d_approvisionnement === 'string' &&
        typeof type === 'string' &&
        (piece_jointe === null || isAttachmentIds(piece_jointe))
    )
}
