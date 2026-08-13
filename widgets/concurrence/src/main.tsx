import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import './index.css'
import App from './App'
import { createGristApprovisionnementQuery } from '@shared/grist/grist-approvisionnement-query'
import { createGristEntrepriseQuery } from '@shared/grist/grist-entreprise-query'
import { createGristInseeQuery } from '@shared/grist/grist-insee-query'
import { createGristInstallationQuery } from '@shared/grist/grist-installation-query'
import { createGristPlanQuery } from '@shared/grist/grist-plan-query'
import { createGristRessourceQuery } from '@shared/grist/grist-ressource-query'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App
            approvisionnements={createGristApprovisionnementQuery()}
            plans={createGristPlanQuery()}
            installations={createGristInstallationQuery()}
            ressources={createGristRessourceQuery()}
            entreprises={createGristEntrepriseQuery()}
            insee={createGristInseeQuery()}
        />
    </StrictMode>
)
