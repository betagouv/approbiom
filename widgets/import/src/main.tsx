import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import App from './App'
import { createGristAttachmentPort } from '@shared/infrastructure/grist/adapters/grist-adapter-attachment'
import { createGristApprovisionnementAImporterAdapter } from '@shared/infrastructure/grist/adapters/grist-adapter-a-importer-approvisionnement'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App
            attachments={createGristAttachmentPort()}
            approvisionnementsAImporter={createGristApprovisionnementAImporterAdapter()}
        />
    </StrictMode>
)
