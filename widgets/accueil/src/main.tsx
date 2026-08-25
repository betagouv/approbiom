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
import { createGristLocalizationPort } from '@shared/infrastructure/grist/adapters/grist-adapter-localization'
import { createGristInstructionPort } from '@shared/infrastructure/grist/adapters/grist-adapter-instruction'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristProgrammeAidePort } from '@shared/infrastructure/grist/adapters/grist-adapter-programme-aide'
import { createGristRessourcePort } from '@shared/infrastructure/grist/adapters/grist-adapter-ressource'
import { createLocalizationAdapter } from '@shared/infrastructure/localization/localization-adapter'
import type { LocalizationPort } from '@shared/core/application/ports/localization'

const localization: LocalizationPort = {
    ...createGristLocalizationPort(),
    ...createLocalizationAdapter(),
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App
            plans={createGristPlanPort()}
            approvisionnements={createGristApprovisionnementPort()}
            ressources={createGristRessourcePort()}
            entreprises={createGristEntreprisePort()}
            listDepartementsByRegion={localization.listDepartementsByRegion}
            getDepartementContour={localization.getDepartementContour}
            getCountryContour={localization.getCountryContour}
            demandesSubvention={createGristDemandeSubventionPort()}
            programmesAide={createGristProgrammeAidePort()}
            instructions={createGristInstructionPort()}
            crbs={createGristCrbPort()}
            attachments={createGristAttachmentPort()}
        />
    </StrictMode>
)
