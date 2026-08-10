import type { PlanDApprovisionnement } from '@shared/domain/plan-d-approvisionnement'
import { updateRowFromTable } from '@shared/grist/api/updateRowFromTable'

const PLAN_TABLE_ID = 'Plan_d_approvisionnement'

export async function updatePlanStatusInGrist(
    planId: PlanDApprovisionnement['id'],
    newStatus: PlanDApprovisionnement['statut']
): Promise<void> {
    await updateRowFromTable(PLAN_TABLE_ID, planId, {
        Statut: newStatus,
    })
}
