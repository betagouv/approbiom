import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'

export interface PlanPort {
    list(): Promise<readonly Plan[]>
}
