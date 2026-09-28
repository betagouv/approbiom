import { useState } from 'react'
import Tabs from '@shared/react/components/Tabs'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import type { DepartementsByRegion } from '@shared/core/application/ports/referentiel-geo'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type {
    ExtractedLineChanges,
    StoredExtractedLine,
} from '../extracted-approvisionnement-port'
import Selection, { type SelectablePlan } from './selection'
import Extraction from './extraction'
import Verification from './verification'

type ExtractedData = {
    lines: readonly StoredExtractedLine[]
    date: Date
}

export type ScreenProps = {
    plans: readonly SelectablePlan[]
    attachments: readonly Attachment[]
    entreprises: readonly Entreprise[]
    ressources: readonly Ressource[]
    departementsByRegion: readonly DepartementsByRegion[]
    pays: readonly Pays[]
    extractDocument: (attachment: Attachment) => Promise<ExtractedData>
    updateExtractedLine: (
        id: StoredExtractedLine['id'],
        changes: ExtractedLineChanges
    ) => Promise<void>
    importLine: (
        approvisionnements: readonly Approvisionnement[],
        line: StoredExtractedLine
    ) => Promise<void>
}

export default function Screen({
    plans,
    attachments,
    entreprises,
    ressources,
    departementsByRegion,
    pays,
    extractDocument,
    updateExtractedLine,
    importLine,
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

    async function updateLine(
        id: StoredExtractedLine['id'],
        changes: ExtractedLineChanges
    ) {
        setExtracted(
            (previous) =>
                previous && {
                    ...previous,
                    lines: previous.lines.map((line) =>
                        line.id === id
                            ? {
                                  ...line,
                                  derived: { ...line.derived, ...changes },
                              }
                            : line
                    ),
                }
        )
        await updateExtractedLine(id, changes)
    }

    async function importReviewedLine(
        approvisionnements: readonly Approvisionnement[],
        imported: StoredExtractedLine
    ) {
        await importLine(approvisionnements, imported)
        setExtracted(
            (previous) =>
                previous && {
                    ...previous,
                    lines: previous.lines.map((line) =>
                        line.id === imported.id
                            ? { ...line, state: 'Importés' as const }
                            : line
                    ),
                }
        )
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
                    content: plan && attachment && extracted && (
                        <Verification
                            plan={plan}
                            attachment={attachment}
                            lines={extracted.lines}
                            date={extracted.date}
                            entreprises={entreprises}
                            ressources={ressources}
                            departementsByRegion={departementsByRegion}
                            pays={pays}
                            onUpdateLine={updateLine}
                            onImportLine={importReviewedLine}
                        />
                    ),
                    disabled: extracted === null,
                },
            ]}
        />
    )
}
