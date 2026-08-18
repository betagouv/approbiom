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
                            // Keyed by plan: opening another dossier mounts
                            // another one, which reads its own statistics.
                            key={dossier.id}
                            plan={dossier}
                            ports={ports}
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
