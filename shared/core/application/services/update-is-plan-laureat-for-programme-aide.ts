import type { ProgrammeAidePort } from '@shared/core/application/ports/programme-aide'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'

export type UpdateIsPlanLaureatForProgrammeAidePorts = {
    programmesAide: ProgrammeAidePort
}

export type UpdateIsPlanLaureatForProgrammeAide = (
    planId: Plan['id'],
    programmeAideId: ProgrammeAide['id'],
    isLaureat: boolean
) => Promise<ProgrammeAide>

export function getUpdateIsPlanLaureatForProgrammeAide({
    programmesAide,
}: UpdateIsPlanLaureatForProgrammeAidePorts): UpdateIsPlanLaureatForProgrammeAide {
    return (planId, programmeAideId, isLaureat) =>
        programmesAide.update(programmeAideId, {
            laureat: isLaureat ? planId : null,
        })
}
