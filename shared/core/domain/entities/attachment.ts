import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'

// Attachment linked to the Plan
export type Attachment = {
    id: number
    planDApprovisionnement: PlanDApprovisionnement['id']
    type: string
    name: string
    sizeInBytes: number
}
