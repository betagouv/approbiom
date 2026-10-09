import AsyncGate from '@shared/react/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import { createGristApprovisionnementPort } from '@shared/infrastructure/grist/adapters/grist-adapter-approvisionnement/grist-adapter-approvisionnement'
import { createGristAttachmentPort } from '@shared/infrastructure/grist/adapters/grist-adapter-attachment'
import { createGristDemandeSubventionPort } from '@shared/infrastructure/grist/adapters/grist-adapter-demande-subvention'
import { createGristEntreprisePort } from '@shared/infrastructure/grist/adapters/grist-adapter-entreprise'
import { createGristExtractedApprovisionnementAdapter } from '@shared/infrastructure/grist/adapters/grist-adapter-extracted-approvisionnement/grist-adapter-extracted-approvisionnement'
import { importRows } from '@shared/infrastructure/import-bcib-bciat/importRows'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristProgrammeAidePort } from '@shared/infrastructure/grist/adapters/grist-adapter-programme-aide'
import { createGristReferentielGeoPort } from '@shared/infrastructure/grist/adapters/grist-adapter-referentiel-geo'
import { createGristRessourcePort } from '@shared/infrastructure/grist/adapters/grist-adapter-ressource'
import { createRechercheEntreprisesPort } from '@shared/infrastructure/referentiel-entreprise/recherche-entreprises-adapter'
import { DataSourceUnavailableError } from '@shared/core/errors'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ExtractedLineChanges } from '@shared/core/application/ports/extracted-approvisionnement'
import { extractApprovisionnementFromDocument } from '@shared/core/application/services/extract-approvisionnement-from-document'
import { importExtractedApprovisionnements } from '@shared/core/application/services/import-extracted-approvisionnements'
import { updateExtractedApprovisionnement } from '@shared/core/application/services/update-extracted-approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import { listPlans } from '@shared/core/application/services/plan-view'
import { FAKE_PORTS } from './fake-data/ports'
import type { Ports } from './ports'
import { findEntrepriseBySiret } from '@shared/core/application/services/find-entreprise-by-siret'
import Screen from './components/Screen'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'

const GRIST_PORTS: Ports = {
    plans: createGristPlanPort(),
    demandesSubvention: createGristDemandeSubventionPort(),
    programmesAide: createGristProgrammeAidePort(),
    approvisionnements: createGristApprovisionnementPort(),
    attachments: createGristAttachmentPort(),
    entreprises: createGristEntreprisePort(),
    ressources: createGristRessourcePort(),
    referentielGeo: createGristReferentielGeoPort(),
    entrepriseSearch: createRechercheEntreprisesPort(),
    extractedApprovisionnements: createGristExtractedApprovisionnementAdapter(),
    documentExtractorApprovisionnement: { extract: importRows },
}

async function load(ports: Ports) {
    const [
        plans,
        approvisionnements,
        attachments,
        entreprises,
        ressources,
        departementsByRegion,
        pays,
        extractions,
    ] = await Promise.all([
        listPlans(
            ['id', 'nom', 'typeDePlan', 'statut', 'appelsAProjet'],
            ports
        ),
        ports.approvisionnements.list(),
        ports.attachments.list(),
        ports.entreprises.list(),
        ports.ressources.list(),
        ports.referentielGeo.listDepartementsByRegion(),
        ports.approvisionnements.listPaysDeProvenance(),
        ports.extractedApprovisionnements.listSummaries(),
    ])

    return {
        plans,
        approvisionnements,
        attachments,
        entreprises,
        ressources,
        departementsByRegion,
        pays,
        extractions,
        listExtractions: () =>
            ports.extractedApprovisionnements.listSummaries(),
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
        createApprovisionnements: (
            approvisionnements: readonly Omit<Approvisionnement, 'id'>[]
        ) => ports.approvisionnements.create(approvisionnements),
        updateApprovisionnement: (
            id: Approvisionnement['id'],
            approvisionnement: Partial<Approvisionnement>
        ) => ports.approvisionnements.update(id, approvisionnement),
        deleteApprovisionnement: (id: Approvisionnement['id']) =>
            ports.approvisionnements.delete(id),
        createEntreprise: (entreprise: Entreprise) =>
            ports.entreprises.create(entreprise),
        findEntrepriseBySiret: (siret: string) =>
            findEntrepriseBySiret(siret, (query) =>
                ports.entrepriseSearch.getEntrepriseFromQuery(query)
            ),
        createPays: (pays: Pays) =>
            ports.approvisionnements.addPaysDeProvenance(pays),
    }
}

export default function App() {
    const state = useAsyncState(() =>
        load(GRIST_PORTS).catch((error: unknown) => {
            if (error instanceof DataSourceUnavailableError)
                return load(FAKE_PORTS)

            throw error
        })
    )

    return (
        <main className="approvisionnements-plan">
            <AsyncGate state={state}>
                {(data) => <Screen {...data} />}
            </AsyncGate>
        </main>
    )
}
