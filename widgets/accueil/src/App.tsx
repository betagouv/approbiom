import AsyncGate from '@shared/user-interface/utils/AsyncGate'
import { renderError } from '@shared/user-interface/utils/render-error'
import { useAsyncData } from '@shared/user-interface/utils/useAsyncData'
import type { PlanDetail } from '@shared/core/application/services/plan-detail'
import { useState } from 'react'
import Accueil from './components/Accueil'
import Dossier from './components/Dossier'
import { loadAccueil, type AccueilPorts } from './load-accueil'

export default function App(ports: AccueilPorts) {
    const state = useAsyncData(() => loadAccueil(ports))

    const [dossier, setDossier] = useState<PlanDetail | null>(null)

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
                            getFileUrl={(id) =>
                                ports.attachments.getFileUrl(id)
                            }
                            onClose={() => setDossier(null)}
                        />
                    )
                }
            </AsyncGate>
        </main>
    )
}
