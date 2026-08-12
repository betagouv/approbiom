import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// DSFR is used as a styling layer only. `core` carries the
// design tokens, icon masks and typography every DSFR component builds on, so
// it is imported once here; each component imports its own stylesheet.
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import './index.css'
import App from './App'
import { createGristApprovisionnementQuery } from '@shared/infrastructure/grist/grist-approvisionnement-query'
import { createGristEntrepriseQuery } from '@shared/infrastructure/grist/grist-entreprise-query'
import { createGristInseeQuery } from '@shared/infrastructure/grist/grist-insee-query'
import { createGristPlanQuery } from '@shared/infrastructure/grist/grist-plan-query'
import { createGristRessourceQuery } from '@shared/infrastructure/grist/grist-ressource-query'

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
        />
    </StrictMode>
)
