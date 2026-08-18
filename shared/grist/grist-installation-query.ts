import type { InstallationQuery } from '@shared/core/application/ports/installation'
import { gristReady } from './grist-ready'
import {
    asNumber,
    asString,
    byRowId,
    fetchRowsOnce,
    lookup,
} from './grist-helpers'
import { COLUMNS, TABLE } from './grist-tables'

export function createGristInstallationQuery(): InstallationQuery {
    return {
        async list() {
            await gristReady()

            const [rows, communes] = await Promise.all([
                fetchRowsOnce(TABLE.installation, COLUMNS.installation),
                fetchRowsOnce(TABLE.commune, COLUMNS.commune),
            ])

            const communeById = byRowId(communes)

            return rows.map((row) => {
                const commune = lookup(communeById, row.Commune)

                return {
                    id: asNumber(row.id) ?? 0,
                    nom: asString(row.Nom),
                    commune: {
                        com: asString(commune?.COM),
                        libelle: asString(commune?.LIBELLE),
                        // The département code, carried as text on the commune
                        // rather than as a reference.
                        dep: asString(commune?.DEP),
                    },
                }
            })
        },
    }
}
