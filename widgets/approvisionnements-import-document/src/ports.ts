import type { PlanViewPorts } from '@shared/core/application/services/plan-view'
import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import type { ExtractedApprovisionnementPort } from '@shared/core/application/ports/extracted-approvisionnement'
import type { DocumentExtractorApprovisionnementPort } from '@shared/core/application/ports/document-extractor-approvisionnement'
import type { RessourcePort } from '@shared/core/application/ports/ressource'
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'

export type Ports = PlanViewPorts & {
    approvisionnements: ApprovisionnementPort
    attachments: Pick<AttachmentPort, 'list' | 'getFileUrl' | 'download'>
    entreprises: EntreprisePort
    entrepriseSearch: EntrepriseSearchPort
    ressources: RessourcePort
    referentielGeo: Pick<ReferentielGeoPort, 'listDepartementsByRegion'>
    extractedApprovisionnements: ExtractedApprovisionnementPort
    documentExtractorApprovisionnement: DocumentExtractorApprovisionnementPort
}
