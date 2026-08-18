import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'

export type DemandeSubvention = {
    id: number
    programmeAide: ProgrammeAide['id']
    planDApprovisionnement: PlanDApprovisionnement['id']
}
