import { useState } from 'react'
import type { ExtractedLineChanges } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Referentiels } from '../referentiels'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import ScreenSelectPlan, { type SelectablePlan } from './ScreenSelectPlan'
import ScreenImportFromDoc, { type AlertMessage } from './ScreenImportFromDoc'
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
    const [imports, setImports] = useState(0)
    const [alert, setAlert] = useState<AlertMessage | null>(null)

    const plan = plans.find(({ id }) => id === planId)

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        setPicking(false)
        setAlert(null)
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
        <ScreenImportFromDoc
            key={`${plan.id}-${imports}`}
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
            updateExtractedApprovisionnement={updateExtractedApprovisionnement}
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
                setImports((count) => count + 1)
            }}
            onChangePlan={() => {
                setAlert(null)
                setPicking(true)
            }}
            alert={alert}
        />
    )
}
