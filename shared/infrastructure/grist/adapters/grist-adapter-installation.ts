import type { InstallationPort } from '@shared/core/application/ports/installation'
import type { Installation } from '@shared/core/domain/entities/installation'
import {
    codeDepartementOf,
    isCodeInseeCommune,
    type Commune,
} from '@shared/core/domain/value-objects/commune'
import { gristReady } from '../helpers/grist-ready'
import { asNumber, asString, fetchRowsOnce } from '../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../types/grist-tables'

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

/**
 * The commune each installation sits at, read off the plans that point at it.
 *
 * The Installation table only holds a Reference to INSEE_Commune, and reading
 * that table — every commune of France — to turn the Reference into a code
 * would cost far more than the plan table, which already carries the code as
 * a formula and which the plan adapter reads anyway.
 */
async function getCommuneByInstallation(): Promise<
    Map<Installation['id'], Installation['commune']>
> {
    const rows = await fetchRowsOnce(TABLE.plan, COLUMNS.plan)

    const communeById = new Map<Installation['id'], Installation['commune']>()

    for (const row of rows) {
        const id = asNumber(row.Installation) ?? 0

        // A plan naming no installation places none: 0 is Grist's empty
        // reference, not a row.
        if (id === 0) continue

        communeById.set(id, asCodeCommune(row.Code_Insee_Installation))
    }

    return communeById
}

export function createGristInstallationPort(): InstallationPort {
    return {
        async list() {
            await gristReady()

            const [rows, communeById] = await Promise.all([
                fetchRowsOnce(TABLE.installation, COLUMNS.installation),
                getCommuneByInstallation(),
            ])

            // An installation no plan points at is placed nowhere: the plans
            // are the only place its commune is read from.
            return rows.map((row): Installation => {
                const id = asNumber(row.id) ?? 0

                return {
                    id,
                    nom: asString(row.Nom),
                    commune: communeById.get(id) ?? '',
                }
            })
        },
    }
}
