import type { InstallationPort } from '@shared/core/application/ports/installation'
import type { Installation } from '@shared/core/domain/entities/installation'
import {
    codeDepartementOf,
    isCodeInseeCommune,
    type Commune,
} from '@shared/core/domain/value-objects/commune'
import { gristReady } from '../grist-ready'
import { asNumber, asString, fetchRowsOnce } from '../grist-helpers'
import { COLUMNS, TABLE } from '../grist-tables'

const asCodeCommune = (value: unknown): Commune['codeInsee'] => {
    const code =
        typeof value === 'number'
            ? String(value).padStart(5, '0')
            : asString(value)

    if (code === '') return ''

    if (codeDepartementOf(code) === undefined || !isCodeInseeCommune(code)) {
        throw new Error(
            `Grist table "${TABLE.plan}" column "Code_Insee_Installation" holds "${code}", which is not an INSEE commune code — check the column carries the commune of the plan's installation. `
        )
    }

    return code
}

export function createGristInstallationPort(): InstallationPort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(TABLE.plan, COLUMNS.plan)

            const byId = new Map<Installation['id'], Installation>()

            for (const row of rows) {
                const id = asNumber(row.Installation) ?? 0

                // A plan naming no installation lists none: 0 is Grist's empty
                // reference, not a row.
                if (id === 0) continue

                byId.set(id, {
                    id,
                    commune: asCodeCommune(row.Code_Insee_Installation),
                })
            }

            return [...byId.values()]
        },
    }
}
