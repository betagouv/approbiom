import AsyncGate from '@shared/react/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import { createGristApprovisionnementPort } from '@shared/infrastructure/grist/adapters/grist-adapter-approvisionnement/grist-adapter-approvisionnement'
import { createGristAttachmentPort } from '@shared/infrastructure/grist/adapters/grist-adapter-attachment'
import { createGristDemandeSubventionPort } from '@shared/infrastructure/grist/adapters/grist-adapter-demande-subvention'
import { createGristEntreprisePort } from '@shared/infrastructure/grist/adapters/grist-adapter-entreprise'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristProgrammeAidePort } from '@shared/infrastructure/grist/adapters/grist-adapter-programme-aide'
import { createGristReferentielGeoPort } from '@shared/infrastructure/grist/adapters/grist-adapter-referentiel-geo'
import { createGristRessourcePort } from '@shared/infrastructure/grist/adapters/grist-adapter-ressource'
import { createRechercheEntreprisesPort } from '@shared/infrastructure/referentiel-entreprise/recherche-entreprises-adapter'
import { DataSourceUnavailableError } from '@shared/core/errors'
import { FAKE_PORTS } from './fake-data/ports'
import type { Ports } from './ports'
import { loadApprovisionnementsSaisieManuelle } from './load-approvisionnements-saisie-manuelle'
import Screen from './components/Screen'

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
}

export default function App() {
    const state = useAsyncState(() =>
        loadApprovisionnementsSaisieManuelle(GRIST_PORTS).catch(
            (error: unknown) => {
                if (error instanceof DataSourceUnavailableError)
                    return loadApprovisionnementsSaisieManuelle(FAKE_PORTS)

                throw error
            }
        )
    )

    return (
        <main className="widget-approvisionnements-saisie-manuelle">
            <AsyncGate state={state}>
                {(data) => <Screen {...data} />}
            </AsyncGate>
        </main>
    )
}
