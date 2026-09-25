import { useState } from 'react'
import Tabs from '@shared/react/components/Tabs'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ImportedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'
import Selection, { type SelectablePlan } from './selection'
import Extraction from './extraction'

type ExtractedData = {
    lines: readonly ImportedLines[]
    date: Date
}

export type ScreenProps = {
    plans: readonly SelectablePlan[]
    attachments: readonly Attachment[]
    // Downloads a document and reads its lines; throws with a message on failure.
    extractDocument: (
        attachment: Attachment
    ) => Promise<readonly ImportedLines[]>
}

export default function Screen({
    plans,
    attachments,
    extractDocument,
}: ScreenProps) {
    const [tab, setTab] = useState('selection')
    const [planId, setPlanId] = useState<SelectablePlan['id'] | null>(null)
    const [attachmentId, setAttachmentId] = useState<Attachment['id'] | null>(
        null
    )

    // Null until "Extraire les données" is clicked: step 2 stays closed.
    // Each click gives a new number, used as Extraction's key so that it
    // restarts with a fresh extraction.
    const [extractionRequest, setExtractionRequest] = useState<number | null>(
        null
    )

    const [extracted, setExtracted] = useState<ExtractedData | null>(null)

    const plan = plans.find(({ id }) => id === planId)
    const attachment = attachments.find(({ id }) => id === attachmentId)

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        selectAttachment(null)
    }

    function selectAttachment(id: Attachment['id'] | null) {
        setAttachmentId(id)
        setExtractionRequest(null)
        setExtracted(null)
    }

    function requestExtraction() {
        setExtractionRequest((previous) => (previous ?? 0) + 1)
        setExtracted(null)
        setTab('extraction')
    }

    function handleExtracted(data: ExtractedData) {
        setExtracted(data)
        setTab('verification')
    }

    return (
        <Tabs
            label="Étapes de l'import"
            currentId={tab}
            onSelect={setTab}
            items={[
                {
                    id: 'selection',
                    label: '1. Sélection du document',
                    content: (
                        <Selection
                            plans={plans}
                            attachments={attachments}
                            selectedPlanId={planId}
                            onSelectPlan={selectPlan}
                            selectedAttachmentId={attachmentId}
                            onSelectAttachment={selectAttachment}
                            onValidate={requestExtraction}
                        />
                    ),
                },
                {
                    id: 'extraction',
                    label: '2. Extraction',
                    content: plan &&
                        attachment &&
                        extractionRequest !== null && (
                            <Extraction
                                key={extractionRequest}
                                plan={plan}
                                attachment={attachment}
                                extract={extractDocument}
                                onExtracted={handleExtracted}
                                onBack={() => setTab('selection')}
                            />
                        ),
                    disabled: extractionRequest === null,
                },
                {
                    id: 'verification',
                    label: '3. Vérification et import',
                    content: extracted && (
                        <pre>{JSON.stringify(extracted.lines, null, 2)}</pre>
                    ),
                    disabled: extracted === null,
                },
            ]}
        />
    )
}
