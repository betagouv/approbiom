import type { PlanDApprovisionnement } from './plan-d-approvisionnement'

export type ProgrammeAide = {
    id: number
    year: number
    name: string
    shortName: string
    appelAProjet: string
    laureat: PlanDApprovisionnement['id'] | null
}
