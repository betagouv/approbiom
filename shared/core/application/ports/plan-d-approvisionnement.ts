import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'

export interface PlanPort {
    list<F extends keyof Plan = keyof Plan>(
        fields?: readonly F[]
    ): Promise<readonly Pick<Plan, F>[]>
}
