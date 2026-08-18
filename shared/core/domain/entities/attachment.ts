import type { PlanDApprovisionnement } from './plan-d-approvisionnement'

export type Attachment = {
    id: number
    planDApprovisionnement: PlanDApprovisionnement['id']
    type: string
    name: string
    sizeInBytes: number
}
