import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// DSFR is used as a styling layer only. `core` carries the
// design tokens, icon masks and typography every DSFR component builds on, so
// it is imported once here; each component imports its own stylesheet.
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import './index.css'
import App from './App'
import { createGristApprovisionnementPort } from '@shared/infrastructure/grist/adapters/grist-adapter-approvisionnement'
import { createGristAttachmentPort } from '@shared/infrastructure/grist/adapters/grist-adapter-attachment'
import { createGristCrbPort } from '@shared/infrastructure/grist/adapters/grist-adapter-crb'
import { createGristDemandeSubventionPort } from '@shared/infrastructure/grist/adapters/grist-adapter-demande-subvention'
import { createGristEntreprisePort } from '@shared/infrastructure/grist/adapters/grist-adapter-entreprise'
import { createGristReferentielGeoPort } from '@shared/infrastructure/grist/adapters/grist-adapter-referentiel-geo'
import { createGristInstallationPort } from '@shared/infrastructure/grist/adapters/grist-adapter-installation'
import { createGristInstructionPort } from '@shared/infrastructure/grist/adapters/grist-adapter-instruction'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristProgrammeAidePort } from '@shared/infrastructure/grist/adapters/grist-adapter-programme-aide'
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
            plans={createGristPlanPort()}
            installations={createGristInstallationPort()}
            approvisionnements={createGristApprovisionnementPort()}
            ressources={createGristRessourcePort()}
            entreprises={createGristEntreprisePort()}
            listDepartementsByRegion={referentielGeo.listDepartementsByRegion}
            getCommuneCenterPosition={referentielGeo.getCommuneCenterPosition}
            getDepartementContour={referentielGeo.getDepartementContour}
            getCountryContour={referentielGeo.getCountryContour}
            demandesSubvention={createGristDemandeSubventionPort()}
            programmesAide={createGristProgrammeAidePort()}
            instructions={createGristInstructionPort()}
            crbs={createGristCrbPort()}
            attachments={createGristAttachmentPort()}
        />
    </StrictMode>
)
