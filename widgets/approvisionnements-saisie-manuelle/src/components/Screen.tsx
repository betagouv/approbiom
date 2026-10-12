import { useState } from 'react'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Referentiels } from '../referentiels'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import ScreenSelectPlan, { type SelectablePlan } from './ScreenSelectPlan'
import ScreenPlanApprovisionnement from './ScreenPlanApprovisionnement'
import { usePlanData, type PlanDataSources } from './usePlanData'

export type ScreenProps = Referentiels &
    PlanDataSources & {
        plans: readonly SelectablePlan[]
        pays: readonly Pays[]
        listAttachments: (
            plan: Attachment['planDApprovisionnement']
        ) => Promise<readonly Attachment[]>
        findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    }

export default function Screen({
    plans,
    ressources,
    departementsByRegion,
    pays,
    listAttachments,
    findEntrepriseBySiret,
    ...sources
}: ScreenProps) {
    const data = usePlanData(sources)
    const [planId, setPlanId] = useState<SelectablePlan['id'] | null>(null)
    const [picking, setPicking] = useState(false)

    const plan = plans.find(({ id }) => id === planId)

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        setPicking(false)
    }

    if (!plan || picking)
        return (
            <ScreenSelectPlan
                plans={plans}
                current={plan}
                onSelect={selectPlan}
                onCancel={() => setPicking(false)}
            />
        )

    return (
        <ScreenPlanApprovisionnement
            key={plan.id}
            plan={plan}
            approvisionnements={data.approvisionnements}
            entreprises={data.entreprises}
            ressources={ressources}
            departementsByRegion={departementsByRegion}
            pays={pays}
            listAttachments={listAttachments}
            onChangePlan={() => setPicking(true)}
            onCreate={(fields) => data.create(plan.id, fields)}
            onUpdate={data.update}
            onDelete={data.remove}
            onCreateEntreprise={data.addEntreprise}
            findEntrepriseBySiret={findEntrepriseBySiret}
        />
    )
}
