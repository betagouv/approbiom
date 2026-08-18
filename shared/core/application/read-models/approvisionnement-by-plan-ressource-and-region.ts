import type { Region } from '@shared/core/domain/value-objects/region'
import type { ApprovisionnementByPlanAndRessource } from '@shared/core/application/read-models/approvisionnement-by-plan-and-ressource'

export type ApprovisionnementByPlanRessourceAndRegion =
    ApprovisionnementByPlanAndRessource & {
        region: Region['libelle']
    }
