import AsyncGate from '@shared/user-interface/utils/AsyncGate'
import { renderError } from '@shared/user-interface/utils/render-error'
import { useAsyncData } from '@shared/user-interface/utils/useAsyncData'
import type { PlanAccueil } from '@shared/application/read-models/plan-accueil'
import { useState } from 'react'
import Accueil from './components/Accueil'
import Dossier from './components/Dossier'
import { loadAccueil, type AccueilPorts } from './load-accueil'

export default function App(ports: AccueilPorts) {
    const state = useAsyncData(() => loadAccueil(ports))

    const [dossier, setDossier] = useState<PlanAccueil | null>(null)

    return (
        <main className="app">
            <AsyncGate state={state} renderError={renderError}>
                {({
                    plansApprovisionnement,
                    ressource,
                    programmesAide,
                    departementsByRegion,
                }) =>
                    dossier === null ? (
                        <Accueil
                            plansApprovisionnement={plansApprovisionnement}
                            departementsByRegion={departementsByRegion}
                            programmesAide={programmesAide}
                            onOpenDossier={setDossier}
                        />
                    ) : (
                        <Dossier
                            plan={dossier}
                            ressource={ressource}
                            onClose={() => setDossier(null)}
                        />
                    )
                }
            </AsyncGate>
        </main>
    )
}
