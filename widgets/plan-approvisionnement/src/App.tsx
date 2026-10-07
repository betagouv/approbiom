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
import { DataSourceUnavailableError } from '@shared/core/errors'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import { listPlans } from '@shared/core/application/services/plan-view'
import { FAKE_PORTS } from './fake-data/ports'
import type { Ports } from './ports'
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
    ])

    return {
        plans,
        approvisionnements,
        attachments,
        entreprises,
        ressources,
        departementsByRegion,
        pays,
        updateApprovisionnement: (
            id: Approvisionnement['id'],
            approvisionnement: Partial<Approvisionnement>
        ) => ports.approvisionnements.update(id, approvisionnement),
        deleteApprovisionnement: (id: Approvisionnement['id']) =>
            ports.approvisionnements.delete(id),
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
