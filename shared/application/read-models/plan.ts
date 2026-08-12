import type { PlanDApprovisionnement } from '@shared/domain/plan-d-approvisionnement'

export type Plan = Pick<PlanDApprovisionnement, 'id' | 'nom' | 'installation'>
