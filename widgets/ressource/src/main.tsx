import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import App from './App'
import { createGristApprovisionnementQuery } from '@shared/grist/adapters/grist-approvisionnement-query'
import { createGristEntrepriseQuery } from '@shared/grist/adapters/grist-entreprise-query'
import { createGristInseeQuery } from '@shared/grist/adapters/grist-insee-query'
import { createGristPlanQuery } from '@shared/grist/adapters/grist-plan-query'
import { createGristRessourceQuery } from '@shared/grist/adapters/grist-ressource-query'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App
            approvisionnements={createGristApprovisionnementQuery()}
            plans={createGristPlanQuery()}
            ressources={createGristRessourceQuery()}
            entreprises={createGristEntrepriseQuery()}
            insee={createGristInseeQuery()}
        />
    </StrictMode>
)
