import AsyncGate from '@shared/react/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import { createGristDemandeSubventionPort } from '@shared/infrastructure/grist/adapters/grist-adapter-demande-subvention'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristProgrammeAidePort } from '@shared/infrastructure/grist/adapters/grist-adapter-programme-aide'
import { DataSourceUnavailableError } from '@shared/core/errors'
import {
    listPlans,
    type PlanViewPorts,
} from '@shared/core/application/services/plan-view'
import { FAKE_PORTS } from './fake-data/ports'
import Screen from './components/Screen'

const GRIST_PORTS: PlanViewPorts = {
    plans: createGristPlanPort(),
    demandesSubvention: createGristDemandeSubventionPort(),
    programmesAide: createGristProgrammeAidePort(),
}

async function load(ports: PlanViewPorts) {
    return {
        plans: await listPlans(
            ['id', 'nom', 'typeDePlan', 'statut', 'appelsAProjet'],
            ports
        ),
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
        <main className="plan-approvisionnement">
            <AsyncGate state={state}>
                {(data) => <Screen {...data} />}
            </AsyncGate>
        </main>
    )
}
