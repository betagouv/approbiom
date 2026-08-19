import AsyncGate from '@shared/react/AsyncGate'
import { renderError } from '@shared/react/render-error'
import { useAsyncData } from '@shared/react/useAsyncData'
import type { PlanDetail } from '@shared/core/application/services/plan-detail'
import { useState } from 'react'
import Accueil from './components/Accueil'
import Dossier from './components/Dossier'
import { loadAccueil, type AccueilPorts } from './load-accueil'

export default function App(ports: AccueilPorts) {
    const state = useAsyncData(() => loadAccueil(ports))

    const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null)

    return (
        <main className="app">
            <AsyncGate state={state} renderError={renderError}>
                {({
                    plansApprovisionnement,
                    programmesAide,
                    departementsByRegion,
                    approvisionnementByRessourceStatsList,
                }) =>
                    selectedPlan === null ? (
                        <Accueil
                            plansApprovisionnement={plansApprovisionnement}
                            departementsByRegion={departementsByRegion}
                            programmesAide={programmesAide}
                            onOpenDossier={setSelectedPlan}
                        />
                    ) : (
                        <Dossier
                            // Keyed by plan: opening another dossier mounts
                            // another one, which reads its own statistics.
                            key={selectedPlan.id}
                            plan={selectedPlan}
                            approvisionnementStatsByRessource={
                                approvisionnementByRessourceStatsList.get(
                                    selectedPlan.id
                                ) ?? []
                            }
                            getFileUrl={(id) =>
                                ports.attachments.getFileUrl(id)
                            }
                            onClose={() => setSelectedPlan(null)}
                        />
                    )
                }
            </AsyncGate>
        </main>
    )
}
