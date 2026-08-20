import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import {
    isCodeDepartement,
    type Departement,
} from '@shared/core/domain/value-objects/departement'
import { isUsageType } from '@shared/core/domain/value-objects/usage'
import { gristReady } from '../grist-ready'
import { asNumber, asString, fetchRowsOnce } from '../grist-helpers'
import { COLUMNS, TABLE } from '../grist-tables'

const asDepartement = (value: unknown): Departement['dep'] | null => {
    const code = typeof value === 'number' ? String(value) : asString(value)

    // An empty cell is a plan the document places nowhere, which is something a
    // plan is allowed to be — unlike a code that names no département.
    if (code === '') return null

    const dep = code.padStart(2, '0')

    if (!isCodeDepartement(dep)) {
        throw new Error(
            `Grist table "${TABLE.plan}" column "Departement_de_situation" holds "${code}", which is not a département code — check the column computes a département. `
        )
    }

    return dep
}

export function createGristPlanPort(): PlanPort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(TABLE.plan, COLUMNS.plan)

            return rows.map((row) => ({
                id: asNumber(row.id) ?? 0,
                nom: asString(row.Nom),
                installation: asNumber(row.Installation) ?? 0,
                // Computed by the document from the installation's commune, so
                // the commune directory is never read to place a plan.
                departement: asDepartement(row.Departement_de_situation),
                typeDePlan: asString(row.Type_de_plan),
                usage: isUsageType(row.Usage_principal)
                    ? row.Usage_principal
                    : null,
                natureDonnee: asString(row.Nature_Donnee),
                statut: asString(row.Statut),
            }))
        },
    }
}
