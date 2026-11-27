import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ExtractedLineChanges } from '@shared/core/application/ports/extracted-approvisionnement'
import { extractApprovisionnementFromDocument } from '@shared/core/application/services/extract-approvisionnement-from-document'
import { importExtractedApprovisionnements } from '@shared/core/application/services/import-extracted-approvisionnements'
import { updateExtractedApprovisionnement } from '@shared/core/application/services/update-extracted-approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import { listPlans } from '@shared/core/application/services/plan-view'
import { countImportedApprovisionnementsByDocument } from '@shared/core/application/services/count-imported-approvisionnements'
import { findEntrepriseBySiret } from '@shared/core/application/services/find-entreprise-by-siret'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'
import type { Ports } from './ports'

export async function loadApprovisionnementsImportDocument(ports: Ports) {
    const [
        plans,
        entreprises,
        ressources,
        departementsByRegion,
        pays,
        extractions,
        imported,
    ] = await Promise.all([
        listPlans(
            ['id', 'nom', 'typeDePlan', 'statut', 'appelsAProjet'],
            ports
        ),
        ports.entreprises.list(),
        ports.ressources.list(['code', 'title']),
        ports.referentielGeo.listDepartementsByRegion(),
        ports.approvisionnements.listPaysDeProvenance(),
        ports.extractedApprovisionnements.listSummaries(),
        countImportedApprovisionnementsByDocument(ports),
    ])

    return {
        plans,
        entreprises,
        ressources,
        departementsByRegion,
        pays,
        extractions,
        imported,
        listExtractions: () =>
            ports.extractedApprovisionnements.listSummaries(),
        countImported: () => countImportedApprovisionnementsByDocument(ports),
        listAttachments: (plan: Attachment['planDApprovisionnement']) =>
            ports.attachments.listByPlan(plan),
        getAttachmentUrl: (id: Attachment['id']) =>
            ports.attachments.getFileUrl(id),
        extractDocument: (attachment: Attachment) =>
            extractApprovisionnementFromDocument(attachment, ports),
        deleteExtraction: (attachment: Attachment) =>
            ports.extractedApprovisionnements.deleteByDocument(attachment),
        updateExtractedApprovisionnement: (
            line: ExtractedApprovisionnement,
            changes: ExtractedLineChanges
        ) =>
            updateExtractedApprovisionnement(
                line,
                changes,
                ports.extractedApprovisionnements
            ),
        importExtractedApprovisionnements: (
            lines: readonly ExtractedApprovisionnement[],
            plan: Approvisionnement['planDApprovisionnement'],
            source: Attachment['id']
        ) => importExtractedApprovisionnements(lines, plan, source, ports),
        createEntreprise: (entreprise: Entreprise) =>
            ports.entreprises.create(entreprise),
        findEntrepriseBySiret: (siret: string) =>
            findEntrepriseBySiret(siret, (query) =>
                ports.entrepriseSearch.getEntrepriseFromQuery(query)
            ),
    }
}
