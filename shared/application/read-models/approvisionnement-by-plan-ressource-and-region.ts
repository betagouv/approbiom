import type { Region } from '@shared/domain/region'
import type { ApprovisionnementByPlanAndRessource } from './approvisionnement-by-plan-and-ressource'

export type ApprovisionnementByPlanRessourceAndRegion =
    ApprovisionnementByPlanAndRessource & {
        region: Region['libelle']
    }
