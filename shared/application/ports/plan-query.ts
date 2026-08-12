import type { Plan } from '@shared/application/read-models/plan'

export interface PlanQuery {
    list(): Promise<readonly Plan[]>
}
