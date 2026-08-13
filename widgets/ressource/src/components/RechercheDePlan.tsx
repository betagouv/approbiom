import './RechercheDePlan.css'
import SearchBar from '@shared/user-interface/component/SearchBar'
import Ressource, {
    type RessourceScreen,
} from '@shared/user-interface/screen/ressource'
import type { PlanDApprovisionnement as Plan } from '@shared/application/domain/plan-d-approvisionnement'

import { useState } from 'react'

export default function RechercheDePlan(screen: RessourceScreen) {
    const [plan, setPlan] = useState<Plan['id'] | null>(null)

    const planOptions = screen.plans.map((plan) => ({
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

            {plan !== null && <Ressource key={plan} {...screen} plan={plan} />}
        </div>
    )
}
