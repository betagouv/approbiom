import type { PlanDApprovisionnement } from './plan-d-approvisionnement'
import type { ProgrammeAide } from './programme-aide'

export type DemandeSubvention = {
    id: number
    programmeAide: ProgrammeAide['id'] // -ref
    planDApprovisionnement: PlanDApprovisionnement['id']
}
