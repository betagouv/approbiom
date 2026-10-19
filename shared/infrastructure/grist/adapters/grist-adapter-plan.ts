import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import { isUsageType } from '@shared/core/domain/value-objects/usage'
import { gristReady } from '../helpers/grist-ready'
import { PLAN_COLUMN_BY_FIELD, TABLE } from '../types/grist-tables'
import {
    asDate,
    asNumber,
    asString,
    fetchRowsOnce,
} from '../helpers/grist-helpers'

const READ: { [F in keyof Plan]: (cell: unknown) => Plan[F] } = {
    id: (cell) => asNumber(cell) ?? 0,
    nom: asString,
    installation: (cell) => asNumber(cell) ?? 0,
    typeDePlan: asString,
    usage: (cell) => (isUsageType(cell) ? cell : null),
    natureDonnee: asString,
    statut: asString,
    createdBy: (cell) => asString(cell) || null,
    createdAt: asDate,
}

const EVERY_FIELD = Object.keys(READ) as (keyof Plan)[]

export function createGristPlanPort(): PlanPort {
    return {
        async list<F extends keyof Plan = keyof Plan>(fields?: readonly F[]) {
            await gristReady()

            // With none asked for, `F` is every field: the default and the
            // type say the same.
            const wanted = (fields ?? EVERY_FIELD) as readonly F[]

            const rows = await fetchRowsOnce(
                TABLE.plan,
                wanted.map((field) => PLAN_COLUMN_BY_FIELD[field])
            )

            // Built field by field, which TypeScript cannot follow back to
            // the `Pick` it adds up to.
            return rows.map(
                (row) =>
                    Object.fromEntries(
                        wanted.map((field) => [
                            field,
                            READ[field](row[PLAN_COLUMN_BY_FIELD[field]]),
                        ])
                    ) as Pick<Plan, F>
            )
        },
    }
}
