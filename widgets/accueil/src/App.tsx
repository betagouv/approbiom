import AsyncGate from '@shared/react/AsyncGate'
import { useAsyncState } from '@shared/react/UseAsyncState'
import type { PlanDetail } from '@shared/core/application/services/plan-detail'
import { useState } from 'react'
import PageAccueil from './components/PageAccueil/PageAccueil'
import Plan from './components/Plan/Plan'
import { loadAccueil, type AccueilPorts } from './load-accueil'

export default function App(ports: AccueilPorts) {
    const state = useAsyncState(() => loadAccueil(ports))

    const [selectedPlanId, setSelectedPlanId] = useState<
        PlanDetail['id'] | null
    >(null)

    return (
        <main className="app">
            <AsyncGate state={state}>
                {({
                    plansApprovisionnement,
                    programmesAide,
                    departementsByRegion,
                    approvisionnementByRessourceStatsList,
                    updateInstruction,
                    updateIsPlanLaureatForProgrammeAide,
                }) => {
                    const selectedPlan =
                        plansApprovisionnement.find(
                            (plan) => plan.id === selectedPlanId
                        ) ?? null

                    return selectedPlan === null ? (
                        <PageAccueil
                            plansApprovisionnement={plansApprovisionnement}
                            departementsByRegion={departementsByRegion}
                            programmesAide={programmesAide}
                            onOpenPlan={(plan) => setSelectedPlanId(plan.id)}
                        />
                    ) : (
                        <Plan
                            // Keyed by plan: opening another plan mounts
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
                            getCommuneCenterPosition={
                                ports.getCommuneCenterPosition
                            }
                            getDepartementContour={ports.getDepartementContour}
                            getCountryContour={ports.getCountryContour}
                            updateInstruction={updateInstruction}
                            updateIsPlanLaureatForProgrammeAide={
                                updateIsPlanLaureatForProgrammeAide
                            }
                            refresh={state.refresh}
                            onClose={() => setSelectedPlanId(null)}
                        />
                    )
                }}
            </AsyncGate>
        </main>
    )
}
