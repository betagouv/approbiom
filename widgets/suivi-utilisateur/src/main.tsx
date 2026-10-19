import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import './index.css'
import App from './App'
import { createGristPlanPort } from '@shared/infrastructure/grist/adapters/grist-adapter-plan'
import { createGristOptionsPort } from './grist-adapter-options'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

// Created here, before the first render, so that it registers the
// configuration screen ahead of the handshake every read waits on.
const options = createGristOptionsPort()

createRoot(rootEl).render(
    <StrictMode>
        <App plans={createGristPlanPort()} options={options} />
    </StrictMode>
)
