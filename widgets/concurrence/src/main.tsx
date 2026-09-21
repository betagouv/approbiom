import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import './index.css'
import App from './App'
import { createGristApprovisionnementPort } from '@shared/infrastructure/grist/adapters/grist-adapter-approvisionnement'
import { createGristEntreprisePort } from '@shared/infrastructure/grist/adapters/grist-adapter-entreprise'
import { createGristInstallationPort } from '@shared/infrastructure/grist/adapters/grist-adapter-installation'
import { createGristReferentielGeoPort } from '@shared/infrastructure/grist/adapters/grist-adapter-referentiel-geo'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristRessourcePort } from '@shared/infrastructure/grist/adapters/grist-adapter-ressource'
import { createReferentielGeoAdapter } from '@shared/infrastructure/referentiel-geo/referentiel-geo-adapter'
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'

const referentielGeo: ReferentielGeoPort = {
    ...createGristReferentielGeoPort(),
    ...createReferentielGeoAdapter(),
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App
            approvisionnements={createGristApprovisionnementPort()}
            plans={createGristPlanPort()}
            installations={createGristInstallationPort()}
            ressources={createGristRessourcePort()}
            entreprises={createGristEntreprisePort()}
            referentielGeo={referentielGeo}
        />
    </StrictMode>
)
