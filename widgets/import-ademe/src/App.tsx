import AsyncGate from '@shared/react/components/AsyncGate'
import Tabs from '@shared/react/components/Tabs'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import { createGristAttachmentPort } from '@shared/infrastructure/grist/adapters/grist-adapter-attachment'
import { createGristDemandeSubventionPort } from '@shared/infrastructure/grist/adapters/grist-adapter-demande-subvention'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristProgrammeAidePort } from '@shared/infrastructure/grist/adapters/grist-adapter-programme-aide'
import { DataSourceUnavailableError } from '@shared/core/errors'
import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import {
    listPlans,
    type PlanViewPorts,
} from '@shared/core/application/services/plan-view'
import Selection from './components/Selection'
import { FAKE_PORTS } from './fake-data/ports'

type Ports = PlanViewPorts & { attachments: AttachmentPort }

const GRIST_PORTS: Ports = {
    plans: createGristPlanPort(),
    demandesSubvention: createGristDemandeSubventionPort(),
    programmesAide: createGristProgrammeAidePort(),
    attachments: createGristAttachmentPort(),
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

    return { plans, attachments }
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
                {({ plans, attachments }) => (
                    <Tabs
                        label="Étapes de l'import"
                        items={[
                            {
                                id: 'selection',
                                label: '1. Sélection du document',
                                content: (
                                    <Selection
                                        plans={plans}
                                        attachments={attachments}
                                    />
                                ),
                            },
                            {
                                id: 'extraction',
                                label: '2. Extraction',
                                content: <p>2. Extraction</p>,
                            },
                            {
                                id: 'verification',
                                label: '3. Vérification et import',
                                content: <p>3. Vérification et import</p>,
                            },
                        ]}
                    />
                )}
            </AsyncGate>
        </main>
    )
}
