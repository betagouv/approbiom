import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'

export type Attachment = {
    id: number
    planDApprovisionnement: PlanDApprovisionnement['id']
    type: string
    name: string
    sizeInBytes: number
}
