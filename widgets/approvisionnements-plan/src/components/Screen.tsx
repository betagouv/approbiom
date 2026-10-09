import { useState } from 'react'
import type { ExtractedLineChanges } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Referentiels } from '../referentiels'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import ScreenSelectPlan, { type SelectablePlan } from './ScreenSelectPlan'
import ScreenPlanApprovisionnement, {
    type AlertMessage,
} from './ScreenPlanApprovisionnement'
import ScreenImportFromDoc from './ScreenImportFromDoc'
import { usePlanData, type PlanDataSources } from './usePlanData'
import type { ExtractedDocument } from '@shared/core/application/services/extract-approvisionnement-from-document'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'

export type ScreenProps = Referentiels &
    PlanDataSources & {
        plans: readonly SelectablePlan[]
        attachments: readonly Attachment[]
        findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
        getAttachmentUrl: (id: Attachment['id']) => Promise<string>
        extractDocument: (attachment: Attachment) => Promise<ExtractedDocument>
        deleteExtraction: (attachment: Attachment) => Promise<void>
        updateExtractedApprovisionnement: (
            line: ExtractedApprovisionnement,
            changes: ExtractedLineChanges
        ) => Promise<ExtractedApprovisionnement>
    }

export default function Screen({
    plans,
    attachments,
    ressources,
    departementsByRegion,
    findEntrepriseBySiret,
    getAttachmentUrl,
    extractDocument,
    deleteExtraction,
    updateExtractedApprovisionnement,
    ...sources
}: ScreenProps) {
    const data = usePlanData(sources)
    const [planId, setPlanId] = useState<SelectablePlan['id'] | null>(null)
    const [picking, setPicking] = useState(false)
    const [importing, setImporting] = useState<
        { resumedId?: Attachment['id'] } | false
    >(false)
    const [alert, setAlert] = useState<AlertMessage | null>(null)

    const plan = plans.find(({ id }) => id === planId)

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        setPicking(false)
        setImporting(false)
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

    if (importing)
        return (
            <ScreenImportFromDoc
                plan={plan}
                attachments={attachments.filter(
                    ({ planDApprovisionnement }) =>
                        planDApprovisionnement === plan.id
                )}
                extractions={
                    new Map(
                        data.extractions.map((summary) => [
                            summary.attachmentId,
                            summary,
                        ])
                    )
                }
                getAttachmentUrl={getAttachmentUrl}
                extractDocument={extractDocument}
                deleteExtraction={deleteExtraction}
                updateExtractedApprovisionnement={
                    updateExtractedApprovisionnement
                }
                entreprises={data.entreprises}
                ressources={ressources}
                departementsByRegion={departementsByRegion}
                pays={data.pays}
                onCreateEntreprise={data.addEntreprise}
                findEntrepriseBySiret={findEntrepriseBySiret}
                onCreatePays={data.addPays}
                importExtractedApprovisionnements={(lines, source) =>
                    data.importLines(lines, plan.id, source)
                }
                onExtractionsChanged={data.refreshExtractions}
                onImported={(imported) => {
                    setAlert(imported)
                    setImporting(false)
                }}
                onBack={() => setImporting(false)}
                resumedId={importing.resumedId}
            />
        )

    return (
        <ScreenPlanApprovisionnement
            key={plan.id}
            plan={plan}
            approvisionnements={data.approvisionnements}
            attachments={attachments}
            entreprises={data.entreprises}
            ressources={ressources}
            departementsByRegion={departementsByRegion}
            pays={data.pays}
            onChangePlan={() => setPicking(true)}
            onCreate={(fields) => data.create(plan.id, fields)}
            onUpdate={data.update}
            onDelete={data.remove}
            onCreateEntreprise={data.addEntreprise}
            findEntrepriseBySiret={findEntrepriseBySiret}
            onCreatePays={data.addPays}
            alert={alert}
            extractions={data.extractions}
            onImportFromDocument={() => {
                setAlert(null)
                setImporting({})
            }}
            onResumeExtraction={(resumedId) => {
                setAlert(null)
                setImporting({ resumedId })
            }}
        />
    )
}
