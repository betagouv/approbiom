import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import './index.css'
import App from './App'
import { createGristApprovisionnementPort } from '@shared/infrastructure/grist/adapters/grist-adapter-approvisionnement'
import { createGristEntreprisePort } from '@shared/infrastructure/grist/adapters/grist-adapter-entreprise'
import { createGristInstallationPort } from '@shared/infrastructure/grist/adapters/grist-adapter-installation'
import { createGristLocalizationPort } from '@shared/infrastructure/grist/adapters/grist-adapter-localization'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
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
            approvisionnements={createGristApprovisionnementPort()}
            plans={createGristPlanPort()}
            installations={createGristInstallationPort()}
            ressources={createGristRessourcePort()}
            entreprises={createGristEntreprisePort()}
            localization={localization}
        />
    </StrictMode>
)
