import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// DSFR is used as a styling layer only. `core` carries the
// design tokens, icon masks and typography every DSFR component builds on, so
// it is imported once here; each component imports its own stylesheet.
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import './index.css'
import App from './App'
import { createGristApprovisionnementQuery } from '@shared/grist/grist-approvisionnement-query'
import { createGristDemandeSubventionQuery } from '@shared/grist/grist-demande-subvention-query'
import { createGristEntrepriseQuery } from '@shared/grist/grist-entreprise-query'
import { createGristInseeQuery } from '@shared/grist/grist-insee-query'
import { createGristInstallationQuery } from '@shared/grist/grist-installation-query'
import { createGristInstructionQuery } from '@shared/grist/grist-instruction-query'
import { createGristPlanQuery } from '@shared/grist/grist-plan-query'
import { createGristProgrammeAideQuery } from '@shared/grist/grist-programme-aide-query'
import { createGristRessourceQuery } from '@shared/grist/grist-ressource-query'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App
            plans={createGristPlanQuery()}
            approvisionnements={createGristApprovisionnementQuery()}
            ressources={createGristRessourceQuery()}
            entreprises={createGristEntrepriseQuery()}
            insee={createGristInseeQuery()}
            demandesSubvention={createGristDemandeSubventionQuery()}
            programmesAide={createGristProgrammeAideQuery()}
            instructions={createGristInstructionQuery()}
            installations={createGristInstallationQuery()}
        />
    </StrictMode>
)
