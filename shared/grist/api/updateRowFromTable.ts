import type { CellValue } from 'grist/GristData'

function getGristApi(): typeof grist {
    if (typeof grist === 'undefined') {
        throw new Error(
            'Grist Plugin API is unavailable. Check that grist-plugin-api.js is loaded.'
        )
    }

    return grist
}

/**
 *
 * @param tableId
 * @param rowId
 * @param updatedFields
 */
export async function updateRowFromTable(
    tableId: string,
    rowId: number,
    updatedFields: Record<string, CellValue>
): Promise<void> {
    await getGristApi()
        .getTable(tableId)
        .update({ id: rowId, fields: updatedFields })
}
