import AsyncGate from '@shared/react/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import { createGristAttachmentPort } from '@shared/infrastructure/grist/adapters/grist-adapter-attachment'
import { createGristDemandeSubventionPort } from '@shared/infrastructure/grist/adapters/grist-adapter-demande-subvention'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristProgrammeAidePort } from '@shared/infrastructure/grist/adapters/grist-adapter-programme-aide'
import { DataSourceUnavailableError } from '@shared/core/errors'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import {
    listPlans,
    type PlanViewPorts,
} from '@shared/core/application/services/plan-view'
import { importRows } from '@shared/infrastructure/import-bcib-bciat/importRows'
import { FAKE_PORTS } from './fake-data/ports'
import Screen from './components/Screen'
import { downloadAndExtract } from './download-and-extract'
import type { AttachmentPort } from '@shared/core/application/ports/attachment'

type Ports = PlanViewPorts & {
    attachments: AttachmentPort
    extractDataFromDocument: typeof importRows
}

const GRIST_PORTS: Ports = {
    plans: createGristPlanPort(),
    demandesSubvention: createGristDemandeSubventionPort(),
    programmesAide: createGristProgrammeAidePort(),
    attachments: createGristAttachmentPort(),
    extractDataFromDocument: importRows,
}

async function load(ports: Ports) {
    const [plans, attachments] = await Promise.all([
        listPlans(['id', 'nom', 'typeDePlan', 'statut', 'appelsAProjet'], {
            plans: ports.plans,
            demandesSubvention: ports.demandesSubvention,
            programmesAide: ports.programmesAide,
        }),
        ports.attachments.list(),
    ])

    return {
        plans,
        attachments,
        extractDocument: (attachment: Attachment) =>
            downloadAndExtract(attachment, {
                getFileUrl: (id) => ports.attachments.getFileUrl(id),
                extractDataFromDocument: ports.extractDataFromDocument,
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
