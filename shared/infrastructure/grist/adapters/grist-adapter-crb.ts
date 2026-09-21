import type { CrbPort } from '@shared/core/application/ports/crb'
import { gristReady } from '../helpers/grist-ready'
import { asNumber, asString, fetchRowsOnce } from '../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../types/grist-tables'

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
