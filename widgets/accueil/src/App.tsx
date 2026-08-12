import AsyncGate from '@shared/react/AsyncGate'
import { renderError } from '@shared/react/render-error'
import { useAsyncData } from '@shared/react/useAsyncData'
import type { Plan } from '@shared/application/read-models/plan'
import { useState } from 'react'
import Accueil from './components/Accueil'
import Dossier from './components/Dossier'
import { loadAccueil, type AccueilPorts } from './load-accueil'

export default function App(ports: AccueilPorts) {
    const state = useAsyncData(() => loadAccueil(ports))

    const [dossier, setDossier] = useState<Plan | null>(null)

    return (
        <main className="app">
            <AsyncGate state={state} renderError={renderError}>
                {({ plansApprovisionnement, ressource, filInstruction }) =>
                    dossier === null ? (
                        <Accueil
                            plansApprovisionnement={plansApprovisionnement}
                            onOpenDossier={setDossier}
                        />
                    ) : (
                        <Dossier
                            plan={dossier}
                            ressource={ressource}
                            filInstruction={filInstruction}
                            onClose={() => setDossier(null)}
                        />
                    )
                }
            </AsyncGate>
        </main>
    )
}
