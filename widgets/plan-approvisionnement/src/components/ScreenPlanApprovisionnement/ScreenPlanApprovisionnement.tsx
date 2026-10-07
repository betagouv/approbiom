import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Tabs from '@shared/react/components/Tabs'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Referentiels } from '../../approvisionnement-rows'
import type { EditableFields } from '../../approvisionnement-form'
import PlanHeader from '../PlanHeader'
import type { SelectablePlan } from '../ScreenSelectPlan'
import TabApprovisionnement from './TabApprovisionnement'
import TabSynthese from './TabSynthese'

export type ScreenPlanApprovisionnementProps = Referentiels & {
    plan: SelectablePlan
    // Those of every plan: the screen keeps the plan's own.
    approvisionnements: readonly Approvisionnement[]
    attachments: readonly Attachment[]
    pays: readonly Pays[]
    onChangePlan: () => void
    onUpdate: (
        id: Approvisionnement['id'],
        fields: EditableFields
    ) => Promise<void>
    onDelete: (id: Approvisionnement['id']) => Promise<void>
}

export default function ScreenPlanApprovisionnement({
    plan,
    approvisionnements,
    attachments,
    pays,
    onChangePlan,
    onUpdate,
    onDelete,
    ...referentiels
}: ScreenPlanApprovisionnementProps) {
    // What the last change did, until the next one.
    const [success, setSuccess] = useState<string | null>(null)

    const planApprovisionnements = approvisionnements.filter(
        ({ planDApprovisionnement }) => planDApprovisionnement === plan.id
    )
    const hasAttachments = attachments.some(
        ({ planDApprovisionnement }) => planDApprovisionnement === plan.id
    )
    const count = planApprovisionnements.length

    return (
        <>
            <PlanHeader plan={plan} onChangePlan={onChangePlan} />
            {success && (
                <Alert severity="success" size="sm">
                    {success}
                </Alert>
            )}
            <Tabs
                label="Vues des approvisionnements"
                items={[
                    {
                        id: 'approvisionnements',
                        label:
                            count > 0
                                ? `Approvisionnements (${count})`
                                : 'Approvisionnements',
                        content: (
                            <TabApprovisionnement
                                approvisionnements={planApprovisionnements}
                                pays={pays}
                                hasAttachments={hasAttachments}
                                onUpdate={async (id, fields) => {
                                    setSuccess(null)
                                    await onUpdate(id, fields)
                                    setSuccess('Approvisionnement modifié.')
                                }}
                                onDelete={async (id) => {
                                    setSuccess(null)
                                    await onDelete(id)
                                    setSuccess('Approvisionnement supprimé.')
                                }}
                                {...referentiels}
                            />
                        ),
                    },
                    {
                        id: 'synthese',
                        label: 'Synthèse',
                        content: (
                            <TabSynthese
                                approvisionnements={planApprovisionnements}
                                hasAttachments={hasAttachments}
                                {...referentiels}
                            />
                        ),
                    },
                ]}
            />
        </>
    )
}
