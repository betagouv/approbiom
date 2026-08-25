import './RechercheDePlan.css'
import SearchBar from '@shared/react/components/SearchBar'
import Ressource from '@shared/react/components/Ressource'
import AsyncGate from '@shared/react/AsyncGate'
import { renderError } from '@shared/react/render-error'
import { useAsyncData } from '@shared/react/useAsyncData'
import {
    getApprovisionnementByRessourceStats,
    type ApprovisionnementByRessourceStats,
    type ApprovisionnementByRessourceStatsPorts,
} from '@shared/core/application/services/approvisionnement-stats'
import type { LocalizationPort } from '@shared/core/application/ports/localization'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'

import { useState } from 'react'

function Statistiques({
    readStats,
    getDepartementContour,
    getCountryContour,
}: {
    readStats: () => Promise<ApprovisionnementByRessourceStats>
    getDepartementContour: LocalizationPort['getDepartementContour']
    getCountryContour: LocalizationPort['getCountryContour']
}) {
    const state = useAsyncData(readStats)

    return (
        <AsyncGate state={state} renderError={renderError}>
            {(stats) => (
                <Ressource
                    approvisionnementStatsByRessource={stats}
                    getDepartementContour={getDepartementContour}
                    getCountryContour={getCountryContour}
                />
            )}
        </AsyncGate>
    )
}

export type RechercheDePlanProps = ApprovisionnementByRessourceStatsPorts & {
    plans: readonly Plan[]
    getDepartementContour: LocalizationPort['getDepartementContour']
    getCountryContour: LocalizationPort['getCountryContour']
}

export default function RechercheDePlan({
    plans,
    approvisionnements,
    ressources,
    entreprises,
    listDepartementsByRegion,
    getDepartementContour,
    getCountryContour,
}: RechercheDePlanProps) {
    const [plan, setPlan] = useState<Plan['id'] | null>(null)

    const planOptions = plans.map((plan) => ({
        value: plan.id,
        label: plan.nom || `Plan ${plan.id}`,
    }))

    return (
        <div className="recherche-de-plan fr-p-2w">
            <SearchBar
                label="Rechercher un plan d’approvisionnement"
                placeholder="Rechercher un plan d’approvisionnement"
                options={planOptions}
                onSelect={setPlan}
            />

            {plan !== null && (
                <Statistiques
                    key={plan}
                    readStats={() =>
                        getApprovisionnementByRessourceStats(
                            {
                                approvisionnements,
                                ressources,
                                entreprises,
                                listDepartementsByRegion,
                            },
                            plan
                        )
                    }
                    getDepartementContour={getDepartementContour}
                    getCountryContour={getCountryContour}
                />
            )}
        </div>
    )
}
