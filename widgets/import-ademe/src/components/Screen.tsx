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
import type { ImportProgress } from '../import-progress'
import type { SiretLookup } from '../find-entreprise-by-siret'
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
    importProgress: ImportProgress
    loadImportProgress: () => Promise<ImportProgress>
    getAttachmentUrl: (id: Attachment['id']) => Promise<string>
    createEntreprise: (entreprise: Entreprise) => Promise<void>
    createPays: (pays: Pays) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    extractDocument: (attachment: Attachment) => Promise<ExtractedData>
    updateExtractedLine: (
        id: StoredExtractedLine['id'],
        changes: ExtractedLineChanges
    ) => Promise<void>
    importLine: (
        approvisionnements: readonly Approvisionnement[]
    ) => Promise<void>
}

export default function Screen({
    plans,
    attachments,
    entreprises: initialEntreprises,
    ressources,
    departementsByRegion,
    pays: initialPays,
    createEntreprise,
    createPays,
    findEntrepriseBySiret,
    importProgress: initialImportProgress,
    loadImportProgress,
    getAttachmentUrl,
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
    const [entreprises, setEntreprises] = useState(initialEntreprises)
    const [pays, setPays] = useState(initialPays)
    const [importProgress, setImportProgress] = useState(initialImportProgress)

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

    async function createFournisseur(entreprise: Entreprise) {
        await createEntreprise(entreprise)
        setEntreprises((previous) => [...previous, entreprise])
    }

    async function createPaysDeProvenance(created: Pays) {
        await createPays(created)
        setPays((previous) => [...previous, created])
    }

    function refreshImportProgress() {
        loadImportProgress().then(setImportProgress, () => {})
    }

    function handleExtracted(data: ExtractedData) {
        setExtracted(data)
        setTab('verification')
        refreshImportProgress()
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

    // Grist decides which lines are imported, and one import can change
    // several of them: the lines are read again.
    async function importReviewedLine(
        approvisionnements: readonly Approvisionnement[]
    ) {
        await importLine(approvisionnements)
        if (attachment) setExtracted(await extractDocument(attachment))
        refreshImportProgress()
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
                            importProgress={importProgress}
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
                                getAttachmentUrl={getAttachmentUrl}
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
                            getAttachmentUrl={getAttachmentUrl}
                            lines={extracted.lines}
                            date={extracted.date}
                            entreprises={entreprises}
                            ressources={ressources}
                            departementsByRegion={departementsByRegion}
                            pays={pays}
                            onUpdateLine={updateLine}
                            onImportLine={importReviewedLine}
                            onCreateFournisseur={createFournisseur}
                            onCreatePays={createPaysDeProvenance}
                            findEntrepriseBySiret={findEntrepriseBySiret}
                        />
                    ),
                    disabled: extracted === null,
                },
            ]}
        />
    )
}
