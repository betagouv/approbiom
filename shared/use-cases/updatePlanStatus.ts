import type { PlanStatus } from '@shared/domain/plan_approvisionnement'
import { updatePlanStatusInGrist } from '@shared/grist/approbiom/plan-grist-service'

type UpdatePlanStatusInput = {
    planId: number
    status: PlanStatus | null
}

export async function updatePlanStatus({
    planId,
    status,
}: UpdatePlanStatusInput): Promise<void> {
    await updatePlanStatusInGrist(planId, status)
}
