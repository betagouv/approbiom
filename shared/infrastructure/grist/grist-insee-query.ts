import type { InseeQuery } from '@shared/application/ports/insee-query'
import type { DepartementsByRegion } from '@shared/application/read-models/departements-by-region'
import { fetchRows } from '@shared/grist/api/client'
import { gristReady } from './grist-ready'
import { asNumber, asString } from './grist-helpers'

type Departements = DepartementsByRegion['departements'][number][]

export function createGristInseeQuery(): InseeQuery {
    return {
        async listDepartementsByRegion() {
            await gristReady()

            const [regions, departements] = await Promise.all([
                fetchRows('INSEE_Region', ['id', 'REG', 'LIBELLE']),
                fetchRows('INSEE_Departement', ['DEP', 'REG']),
            ])

            // `REG` on a département is a Ref: it holds the région's rowId.
            const departementsByRegionId = new Map<number, Departements>()
            for (const departement of departements) {
                const regionId = asNumber(departement.REG)
                if (regionId === undefined) continue

                const group = departementsByRegionId.get(regionId) ?? []
                group.push({ dep: asString(departement.DEP) })
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
