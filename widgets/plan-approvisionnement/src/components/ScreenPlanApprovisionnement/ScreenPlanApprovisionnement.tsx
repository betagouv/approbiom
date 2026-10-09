import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Tabs from '@shared/react/components/Tabs'
import type { ExtractionSummary } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Referentiels } from '../../referentiels'
import type { EditableFields } from '../../approvisionnement-form'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import PlanHeader from '../PlanHeader'
import type { SelectablePlan } from '../ScreenSelectPlan'
import ExtractionsInProgress from './ExtractionsInProgress'
import TabApprovisionnement from './TabApprovisionnement'
import TabSynthese from './TabSynthese'

export type ScreenPlanApprovisionnementProps = Referentiels & {
    plan: SelectablePlan
    approvisionnements: readonly Approvisionnement[]
    attachments: readonly Attachment[]
    extractions: readonly ExtractionSummary[]
    pays: readonly Pays[]
    notice?: string | null
    onChangePlan: () => void
    onCreate: (fields: EditableFields) => Promise<void>
    onUpdate: (
        id: Approvisionnement['id'],
        fields: EditableFields
    ) => Promise<void>
    onDelete: (id: Approvisionnement['id']) => Promise<void>
    onCreateEntreprise: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    onCreatePays: (pays: Pays) => Promise<void>
    onImportFromDocument: () => void
    onResumeExtraction: (id: Attachment['id']) => void
}

export default function ScreenPlanApprovisionnement({
    plan,
    approvisionnements,
    attachments,
    extractions,
    pays,
    notice = null,
    onChangePlan,
    onCreate,
    onUpdate,
    onDelete,
    onCreateEntreprise,
    findEntrepriseBySiret,
    onCreatePays,
    onImportFromDocument,
    onResumeExtraction,
    ...referentiels
}: ScreenPlanApprovisionnementProps) {
    const [success, setSuccess] = useState<string | null>(notice)

    const planApprovisionnements = approvisionnements.filter(
        ({ planDApprovisionnement }) => planDApprovisionnement === plan.id
    )
    const planAttachments = attachments.filter(
        ({ planDApprovisionnement }) => planDApprovisionnement === plan.id
    )
    const hasAttachments = planAttachments.length > 0
    const extractionsInProgress = planAttachments.flatMap((attachment) => {
        const summary = extractions.find(
            ({ attachmentId }) => attachmentId === attachment.id
        )

        return summary && summary.lineCount > 0 ? [{ attachment, summary }] : []
    })
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
                                onCreate={async (fields) => {
                                    setSuccess(null)
                                    await onCreate(fields)
                                    setSuccess('Approvisionnement créé.')
                                }}
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
                                onCreateEntreprise={onCreateEntreprise}
                                findEntrepriseBySiret={findEntrepriseBySiret}
                                onCreatePays={onCreatePays}
                                onImportFromDocument={onImportFromDocument}
                                {...referentiels}
                            >
                                <ExtractionsInProgress
                                    extractions={extractionsInProgress}
                                    onResume={onResumeExtraction}
                                />
                            </TabApprovisionnement>
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
