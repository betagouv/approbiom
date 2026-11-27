import type { PlanViewPorts } from '@shared/core/application/services/plan-view'
import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import type { ExtractedApprovisionnementPort } from '@shared/core/application/ports/extracted-approvisionnement'
import type { DocumentExtractorApprovisionnementPort } from '@shared/core/application/ports/document-extractor-approvisionnement'
import type { RessourcesPort } from '@shared/core/application/ports/ressources'
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'

export type Ports = PlanViewPorts & {
    approvisionnements: Pick<
        ApprovisionnementPort,
        'list' | 'create' | 'listPaysDeProvenance'
    >
    attachments: Pick<AttachmentPort, 'listByPlan' | 'getFileUrl' | 'download'>
    entreprises: EntreprisePort
    entrepriseSearch: EntrepriseSearchPort
    ressources: RessourcesPort
    referentielGeo: Pick<ReferentielGeoPort, 'listDepartementsByRegion'>
    extractedApprovisionnements: ExtractedApprovisionnementPort
    documentExtractorApprovisionnement: DocumentExtractorApprovisionnementPort
}
