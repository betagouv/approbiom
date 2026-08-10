import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import './index.css'
import App from './App'
import { createGristApprovisionnementQuery } from '@shared/infrastructure/grist/grist-approvisionnement-query'
import { createGristInseeQuery } from '@shared/infrastructure/grist/grist-insee-query'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App
            approvisionnements={createGristApprovisionnementQuery()}
            insee={createGristInseeQuery()}
        />
    </StrictMode>
)
