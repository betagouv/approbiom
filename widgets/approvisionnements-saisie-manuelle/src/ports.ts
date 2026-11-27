import type { PlanViewPorts } from '@shared/core/application/services/plan-view'
import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import type { RessourcesPort } from '@shared/core/application/ports/ressources'
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'

export type Ports = PlanViewPorts & {
    approvisionnements: ApprovisionnementPort
    attachments: Pick<AttachmentPort, 'listByPlan'>
    entreprises: EntreprisePort
    entrepriseSearch: EntrepriseSearchPort
    ressources: RessourcesPort
    referentielGeo: Pick<ReferentielGeoPort, 'listDepartementsByRegion'>
}
