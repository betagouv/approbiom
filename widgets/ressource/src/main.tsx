import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import App from './App'
import { createGristApprovisionnementPort } from '@shared/infrastructure/grist/adapters/grist-adapter-approvisionnement'
import { createGristEntreprisePort } from '@shared/infrastructure/grist/adapters/grist-adapter-entreprise'
import { createGristInseePort } from '@shared/infrastructure/grist/adapters/grist-adapter-insee'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristRessourcePort } from '@shared/infrastructure/grist/adapters/grist-adapter-ressource'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App
            approvisionnements={createGristApprovisionnementPort()}
            plans={createGristPlanPort()}
            ressources={createGristRessourcePort()}
            entreprises={createGristEntreprisePort()}
            insee={createGristInseePort()}
        />
    </StrictMode>
)
