import type { CrbPort } from '@shared/core/application/ports/crb'
import { gristReady } from '../grist-ready'
import { asNumber, asString, fetchRowsOnce } from '../grist-helpers'
import { COLUMNS, TABLE } from '../grist-tables'

export function createGristCrbPort(): CrbPort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(TABLE.crb, COLUMNS.crb)

            return rows.map((row) => ({
                id: asNumber(row.id) ?? 0,
                name: asString(row.Nom),
            }))
        },
    }
}
