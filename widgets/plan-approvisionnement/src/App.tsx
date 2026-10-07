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
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import { listPlans } from '@shared/core/application/services/plan-view'
import { FAKE_PORTS } from './fake-data/ports'
import type { Ports } from './ports'
import { findEntrepriseBySiret } from '@shared/core/application/services/find-entreprise-by-siret'
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
