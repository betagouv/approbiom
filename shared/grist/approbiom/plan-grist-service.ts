import type { PlanApprovisionnement } from '@shared/domain/plan_approvisionnement'
import { updateRowFromTable } from '@shared/grist/api/updateRowFromTable'

const PLAN_TABLE_ID = 'Plan_d_approvisionnement'

export async function updatePlanStatusInGrist(
    planId: PlanApprovisionnement['id'],
    newStatus: PlanApprovisionnement['statut']
): Promise<void> {
    await updateRowFromTable(PLAN_TABLE_ID, planId, {
        Statut: newStatus,
    })
}
