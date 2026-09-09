import './RechercheDePlan.css'
import SearchBar from '@shared/react/components/SearchBar'
import Ressource from '@shared/react/components/Ressource'
import AsyncGate from '@shared/react/AsyncGate'
import { useAsyncState } from '@shared/react/UseAsyncState'
import {
    getApprovisionnementByRessourceStats,
    type ApprovisionnementByRessourceStats,
    type ApprovisionnementByRessourceStatsPorts,
} from '@shared/core/application/services/approvisionnement-stats'
import type { LocalizationPort } from '@shared/core/application/ports/localization'
import type { Commune } from '@shared/core/domain/value-objects/commune'
import type { Installation } from '@shared/core/domain/entities/installation'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'

import { useState } from 'react'

function Statistiques({
    readStats,
    commune,
    getCommuneCenterPosition,
    getDepartementContour,
    getCountryContour,
}: {
    readStats: () => Promise<ApprovisionnementByRessourceStats>
    commune: Commune['codeInsee'] | null
    getCommuneCenterPosition: LocalizationPort['getCommuneCenterPosition']
    getDepartementContour: LocalizationPort['getDepartementContour']
    getCountryContour: LocalizationPort['getCountryContour']
}) {
    const state = useAsyncState(readStats)

    return (
        <AsyncGate state={state}>
            {(stats) => (
                <Ressource
                    approvisionnementStatsByRessource={stats}
                    commune={commune}
                    getCommuneCenterPosition={getCommuneCenterPosition}
                    getDepartementContour={getDepartementContour}
                    getCountryContour={getCountryContour}
                />
            )}
        </AsyncGate>
    )
}

export type RechercheDePlanProps = ApprovisionnementByRessourceStatsPorts & {
    plans: readonly Plan[]
    installations: readonly Installation[]
    getCommuneCenterPosition: LocalizationPort['getCommuneCenterPosition']
    getDepartementContour: LocalizationPort['getDepartementContour']
    getCountryContour: LocalizationPort['getCountryContour']
}

export default function RechercheDePlan({
    plans,
    installations,
    approvisionnements,
    ressources,
    entreprises,
    listDepartementsByRegion,
    getCommuneCenterPosition,
    getDepartementContour,
    getCountryContour,
}: RechercheDePlanProps) {
    const [plan, setPlan] = useState<Plan['id'] | null>(null)

    const planOptions = plans.map((plan) => ({
        value: plan.id,
        label: plan.nom || `Plan ${plan.id}`,
    }))

    const communeByInstallation = new Map(
        installations.map(({ id, commune }) => [id, commune] as const)
    )
    const selected = plans.find(({ id }) => id === plan)
    const commune =
        communeByInstallation.get(selected?.installation ?? 0) || null

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
                    commune={commune}
                    getCommuneCenterPosition={getCommuneCenterPosition}
                    getDepartementContour={getDepartementContour}
                    getCountryContour={getCountryContour}
                />
            )}
        </div>
    )
}
