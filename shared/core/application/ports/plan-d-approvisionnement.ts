import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'

export interface PlanQuery {
    list(): Promise<readonly Plan[]>
}
