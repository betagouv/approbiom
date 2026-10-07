import { useState } from 'react'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Referentiels } from '../referentiels'
import type { EditableFields } from '../approvisionnement-form'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import ScreenSelectPlan, { type SelectablePlan } from './ScreenSelectPlan'
import ScreenPlanApprovisionnement from './ScreenPlanApprovisionnement'

export type ScreenProps = Referentiels & {
    plans: readonly SelectablePlan[]
    approvisionnements: readonly Approvisionnement[]
    attachments: readonly Attachment[]
    pays: readonly Pays[]
    // The ids given, in the order of the approvisionnements.
    createApprovisionnements: (
        approvisionnements: readonly Omit<Approvisionnement, 'id'>[]
    ) => Promise<Approvisionnement['id'][]>
    updateApprovisionnement: (
        id: Approvisionnement['id'],
        approvisionnement: Partial<Approvisionnement>
    ) => Promise<void>
    deleteApprovisionnement: (id: Approvisionnement['id']) => Promise<void>
    createEntreprise: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    createPays: (pays: Pays) => Promise<void>
}

export default function Screen({
    plans,
    approvisionnements: initialApprovisionnements,
    entreprises: initialEntreprises,
    pays: initialPays,
    createApprovisionnements,
    updateApprovisionnement,
    deleteApprovisionnement,
    createEntreprise,
    findEntrepriseBySiret,
    createPays,
    ...data
}: ScreenProps) {
    const [planId, setPlanId] = useState<SelectablePlan['id'] | null>(null)
    // True while another plan is being looked for.
    const [picking, setPicking] = useState(false)
    // Kept in step with the table: changed once it has been written.
    const [approvisionnements, setApprovisionnements] = useState(
        initialApprovisionnements
    )
    // Fournisseurs and pays created from the form join the lists.
    const [entreprises, setEntreprises] = useState(initialEntreprises)
    const [pays, setPays] = useState(initialPays)

    const plan = plans.find(({ id }) => id === planId)

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        setPicking(false)
    }

    async function create(
        planDApprovisionnement: SelectablePlan['id'],
        fields: EditableFields
    ) {
        const approvisionnement = { planDApprovisionnement, ...fields }
        const [id] = await createApprovisionnements([approvisionnement])
        setApprovisionnements((previous) => [
            ...previous,
            { ...approvisionnement, id },
        ])
    }

    async function addEntreprise(entreprise: Entreprise) {
        await createEntreprise(entreprise)
        setEntreprises((previous) => [...previous, entreprise])
    }

    async function addPays(created: Pays) {
        await createPays(created)
        setPays((previous) => [...previous, created])
    }

    async function update(
        id: Approvisionnement['id'],
        changes: Partial<Approvisionnement>
    ) {
        await updateApprovisionnement(id, changes)
        setApprovisionnements((previous) =>
            previous.map((approvisionnement) =>
                approvisionnement.id === id
                    ? { ...approvisionnement, ...changes }
                    : approvisionnement
            )
        )
    }

    async function remove(id: Approvisionnement['id']) {
        await deleteApprovisionnement(id)
        setApprovisionnements((previous) =>
            previous.filter((approvisionnement) => approvisionnement.id !== id)
        )
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
            // Another plan starts on its first tab, with no filter left on.
            key={plan.id}
            plan={plan}
            approvisionnements={approvisionnements}
            entreprises={entreprises}
            pays={pays}
            onChangePlan={() => setPicking(true)}
            onCreate={(fields) => create(plan.id, fields)}
            onUpdate={update}
            onDelete={remove}
            onCreateEntreprise={addEntreprise}
            findEntrepriseBySiret={findEntrepriseBySiret}
            onCreatePays={addPays}
            {...data}
        />
    )
}
