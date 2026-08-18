import type { InseeQuery } from '@shared/core/application/ports/insee-query'
import type { DepartementsByRegion } from '@shared/core/application/read-models/departements-by-region'
import { gristReady } from './grist-ready'
import { asNumber, asString, fetchRowsOnce } from './grist-helpers'
import { COLUMNS, TABLE } from './grist-tables'

type Departements = DepartementsByRegion['departements'][number][]

export function createGristInseeQuery(): InseeQuery {
    return {
        async listDepartementsByRegion() {
            await gristReady()

            const [regions, departements] = await Promise.all([
                fetchRowsOnce(TABLE.region, COLUMNS.region),
                fetchRowsOnce(TABLE.departement, COLUMNS.departement),
            ])

            // `REG` on a département is a Ref: it holds the région's rowId.
            const departementsByRegionId = new Map<number, Departements>()
            for (const departement of departements) {
                const regionId = asNumber(departement.REG)
                if (regionId === undefined) continue

                const group = departementsByRegionId.get(regionId) ?? []
                group.push({
                    dep: asString(departement.DEP),
                    libelle: asString(departement.LIBELLE),
                })
                departementsByRegionId.set(regionId, group)
            }

            return regions.map((region) => ({
                region: {
                    reg: asString(region.REG),
                    libelle: asString(region.LIBELLE),
                },
                departements:
                    departementsByRegionId.get(asNumber(region.id) ?? -1) ?? [],
            }))
        },
    }
}
