import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Tabs from '@shared/react/components/Tabs'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Referentiels } from '../../referentiels'
import type { EditableFields } from '../../approvisionnement-form'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import PlanHeader from '@shared/react/components/PlanHeader'
import type { SelectablePlan } from '../ScreenSelectPlan'
import TabApprovisionnement from './TabApprovisionnement'
import TabSynthese from './TabSynthese'

type AlertMessage = { severity: 'success'; text: string }

const success = (text: string): AlertMessage => ({ severity: 'success', text })

export type ScreenPlanApprovisionnementProps = Referentiels & {
    plan: SelectablePlan
    approvisionnements: readonly Approvisionnement[]
    pays: readonly Pays[]
    onChangePlan: () => void
    onCreate: (fields: EditableFields) => Promise<void>
    onUpdate: (
        id: Approvisionnement['id'],
        fields: EditableFields
    ) => Promise<void>
    onDelete: (id: Approvisionnement['id']) => Promise<void>
    onCreateEntreprise: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
}

export default function ScreenPlanApprovisionnement({
    plan,
    approvisionnements,
    pays,
    onChangePlan,
    onCreate,
    onUpdate,
    onDelete,
    onCreateEntreprise,
    findEntrepriseBySiret,
    ...referentiels
}: ScreenPlanApprovisionnementProps) {
    const [shownAlert, setShownAlert] = useState<AlertMessage | null>(null)

    const planApprovisionnements = approvisionnements.filter(
        ({ planDApprovisionnement }) => planDApprovisionnement === plan.id
    )
    const count = planApprovisionnements.length

    return (
        <>
            <PlanHeader plan={plan} onChangePlan={onChangePlan} />
            {shownAlert && (
                <Alert severity={shownAlert.severity} size="sm">
                    {shownAlert.text}
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
                                onCreate={async (fields) => {
                                    setShownAlert(null)
                                    await onCreate(fields)
                                    setShownAlert(
                                        success('Approvisionnement créé.')
                                    )
                                }}
                                onUpdate={async (id, fields) => {
                                    setShownAlert(null)
                                    await onUpdate(id, fields)
                                    setShownAlert(
                                        success('Approvisionnement modifié.')
                                    )
                                }}
                                onDuplicate={async (fields) => {
                                    setShownAlert(null)
                                    await onCreate(fields)
                                    setShownAlert(
                                        success('Approvisionnement dupliqué.')
                                    )
                                }}
                                onDelete={async (id) => {
                                    setShownAlert(null)
                                    await onDelete(id)
                                    setShownAlert(
                                        success('Approvisionnement supprimé.')
                                    )
                                }}
                                onCreateEntreprise={onCreateEntreprise}
                                findEntrepriseBySiret={findEntrepriseBySiret}
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
                                {...referentiels}
                            />
                        ),
                    },
                ]}
            />
        </>
    )
}
