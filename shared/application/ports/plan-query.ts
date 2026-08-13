import type { PlanDApprovisionnement as Plan } from '@shared/application/domain/plan-d-approvisionnement'

export interface PlanQuery {
    list(): Promise<readonly Plan[]>
}
