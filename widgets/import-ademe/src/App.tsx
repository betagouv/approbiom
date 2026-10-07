import AsyncGate from '@shared/react/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import { createGristAttachmentPort } from '@shared/infrastructure/grist/adapters/grist-adapter-attachment'
import { createGristEntreprisePort } from '@shared/infrastructure/grist/adapters/grist-adapter-entreprise'
import { createGristRessourcePort } from '@shared/infrastructure/grist/adapters/grist-adapter-ressource'
import { createGristDemandeSubventionPort } from '@shared/infrastructure/grist/adapters/grist-adapter-demande-subvention'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristProgrammeAidePort } from '@shared/infrastructure/grist/adapters/grist-adapter-programme-aide'
import { createGristReferentielGeoPort } from '@shared/infrastructure/grist/adapters/grist-adapter-referentiel-geo'
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'
import { createGristApprovisionnementPort } from '@shared/infrastructure/grist/adapters/grist-adapter-approvisionnement/grist-adapter-approvisionnement'
import { createGristExtractedApprovisionnementAdapter } from '@shared/infrastructure/grist/adapters/grist-adapter-extracted-approvisionnement'
import { DataSourceUnavailableError } from '@shared/core/errors'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import {
    listPlans,
    type PlanViewPorts,
} from '@shared/core/application/services/plan-view'
import { importRows } from '@shared/infrastructure/import-bcib-bciat/importRows'
import { FAKE_PORTS } from './fake-data/ports'
import Screen from './components/Screen'
import { downloadAndExtract } from './download-and-extract'
import { extractDocument } from './extract-document'
import { importLine } from './import-line'
import { loadImportProgress } from './import-progress'
import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type {
    ExtractedApprovisionnementPort,
    ExtractedLineChanges,
    StoredExtractedLine,
} from './extracted-approvisionnement-port'
import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { RessourcePort } from '@shared/core/application/ports/ressource'
import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import { createRechercheEntreprisesPort } from '@shared/infrastructure/referentiel-entreprise/recherche-entreprises-adapter'
import { findEntrepriseBySiret } from './find-entreprise-by-siret'

type Ports = PlanViewPorts & {
    attachments: AttachmentPort
    entreprises: EntreprisePort
    ressources: RessourcePort
    extractDataFromDocument: typeof importRows
    extractedApprovisionnements: ExtractedApprovisionnementPort
    approvisionnements: ApprovisionnementPort
    referentielGeo: Pick<ReferentielGeoPort, 'listDepartementsByRegion'>
    entrepriseSearch: EntrepriseSearchPort
}

const GRIST_PORTS: Ports = {
    plans: createGristPlanPort(),
    demandesSubvention: createGristDemandeSubventionPort(),
    programmesAide: createGristProgrammeAidePort(),
    attachments: createGristAttachmentPort(),
    entreprises: createGristEntreprisePort(),
    ressources: createGristRessourcePort(),
    extractDataFromDocument: importRows,
    extractedApprovisionnements: createGristExtractedApprovisionnementAdapter(),
    approvisionnements: createGristApprovisionnementPort(),
    referentielGeo: createGristReferentielGeoPort(),
    entrepriseSearch: createRechercheEntreprisesPort(),
}

async function load(ports: Ports) {
    const [
        plans,
        attachments,
        entreprises,
        ressources,
        departementsByRegion,
        pays,
        importProgress,
    ] = await Promise.all([
        listPlans(['id', 'nom', 'typeDePlan', 'statut', 'appelsAProjet'], {
            plans: ports.plans,
            demandesSubvention: ports.demandesSubvention,
            programmesAide: ports.programmesAide,
        }),
        ports.attachments.list(),
        ports.entreprises.list(),
        ports.ressources.list(),
        ports.referentielGeo.listDepartementsByRegion(),
        ports.approvisionnements.listPaysDeProvenance(),
        loadImportProgress(ports),
    ])

    return {
        plans,
        attachments,
        entreprises,
        ressources,
        departementsByRegion,
        pays,
        importProgress,
        loadImportProgress: () => loadImportProgress(ports),
        createEntreprise: (entreprise: Entreprise) =>
            ports.entreprises.create(entreprise),
        findEntrepriseBySiret: (siret: string) =>
            findEntrepriseBySiret(siret, (query) =>
                ports.entrepriseSearch.getEntrepriseFromQuery(query)
            ),
        createPays: (created: Pays) =>
            ports.approvisionnements.addPaysDeProvenance(created),
        getAttachmentUrl: (id: Attachment['id']) =>
            ports.attachments.getFileUrl(id),
        updateExtractedLine: (
            id: StoredExtractedLine['id'],
            changes: ExtractedLineChanges
        ) => ports.extractedApprovisionnements.update(id, changes),
        importLine: (
            approvisionnements: readonly Omit<Approvisionnement, 'id'>[]
        ) => importLine(approvisionnements, ports),
        extractDocument: (attachment: Attachment) =>
            extractDocument(attachment, {
                extractedApprovisionnements: ports.extractedApprovisionnements,
                downloadAndExtract: () =>
                    downloadAndExtract(attachment, {
                        getFileUrl: (id) => ports.attachments.getFileUrl(id),
                        extractDataFromDocument: ports.extractDataFromDocument,
                        listEntreprises: () => ports.entreprises.list(),
                        listRessources: () => ports.ressources.list(),
                    }),
            }),
    }
}

export default function App() {
    const state = useAsyncState(() =>
        load(GRIST_PORTS).catch((error: unknown) => {
            // Outside Grist, the widget runs on the fake data instead.
            if (error instanceof DataSourceUnavailableError)
                return load(FAKE_PORTS)

            throw error
        })
    )

    return (
        <main className="import-ademe">
            <header>
                <h1 className="fr-h6 fr-mb-0">
                    Importer un document Ademe BCIB/BCIAT
                </h1>
            </header>

            <AsyncGate state={state}>
                {(data) => <Screen {...data} />}
            </AsyncGate>
        </main>
    )
}
