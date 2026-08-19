import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// DSFR is used as a styling layer only. `core` carries the
// design tokens, icon masks and typography every DSFR component builds on, so
// it is imported once here; each component imports its own stylesheet.
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import './index.css'
import App from './App'
import { createGristApprovisionnementPort } from '@shared/grist/adapters/grist-adapter-approvisionnement'
import { createGristAttachmentPort } from '@shared/grist/adapters/grist-adapter-attachment'
import { createGristDemandeSubventionPort } from '@shared/grist/adapters/grist-adapter-demande-subvention'
import { createGristEntreprisePort } from '@shared/grist/adapters/grist-adapter-entreprise'
import { createGristInseePort } from '@shared/grist/adapters/grist-adapter-insee'
import { createGristInstallationPort } from '@shared/grist/adapters/grist-adapter-installation'
import { createGristInstructionPort } from '@shared/grist/adapters/grist-adapter-instruction'
import { createGristPlanPort } from '@shared/grist/adapters/grist-adapter-plan'
import { createGristProgrammeAidePort } from '@shared/grist/adapters/grist-adapter-programme-aide'
import { createGristRessourcePort } from '@shared/grist/adapters/grist-adapter-ressource'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App
            plans={createGristPlanPort()}
            approvisionnements={createGristApprovisionnementPort()}
            ressources={createGristRessourcePort()}
            entreprises={createGristEntreprisePort()}
            insee={createGristInseePort()}
            demandesSubvention={createGristDemandeSubventionPort()}
            programmesAide={createGristProgrammeAidePort()}
            instructions={createGristInstructionPort()}
            installations={createGristInstallationPort()}
            attachments={createGristAttachmentPort()}
        />
    </StrictMode>
)
