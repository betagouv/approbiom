import './ScreenImportFromDoc.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Combobox from '@shared/react/components/Combobox'
import Tabs from '@shared/react/components/Tabs'
import type {
    ExtractedLineChanges,
    ExtractionSummary,
} from '@shared/core/application/ports/extracted-approvisionnement'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    ApprovisionnementsNotCreatedError,
    ExtractedLinesNotDeletedError,
} from '@shared/core/application/services/import-extracted-approvisionnements'
import type { ExtractedDocument } from '@shared/core/application/services/extract-approvisionnement-from-document'
import type { Referentiels } from '../../referentiels'
import PlanHeader, { type SelectablePlan } from '../PlanHeader'
import DocumentContext from './DocumentContext'
import DocumentPicker from './DocumentPicker'
import Extraction from './Extraction'
import ReextractModal from './ReextractModal'
import Verification from './Verification'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'
import { plural } from '@shared/react/format'

type AlertMessage = { severity: 'success' | 'warning'; text: string }

type Tab = 'selection' | 'extraction' | 'verification'

type ExtractionRequest = { run: number; resumed: boolean }

type ExtractedStep = { document: ExtractedDocument; resumed: boolean }

type PlanDocuments =
    | { plan: SelectablePlan['id']; status: 'loading' | 'failed' }
    | {
          plan: SelectablePlan['id']
          status: 'loaded'
          attachments: readonly Attachment[]
      }

export type ScreenImportFromDocProps = Referentiels & {
    plans: readonly SelectablePlan[]
    listAttachments: (
        plan: SelectablePlan['id']
    ) => Promise<readonly Attachment[]>
    extractions: ReadonlyMap<Attachment['id'], ExtractionSummary>
    imported: ReadonlyMap<Attachment['id'], number>
    getAttachmentUrl: (id: Attachment['id']) => Promise<string>
    extractDocument: (attachment: Attachment) => Promise<ExtractedDocument>
    deleteExtraction: (attachment: Attachment) => Promise<void>
    updateExtractedApprovisionnement: (
        line: ExtractedApprovisionnement,
        changes: ExtractedLineChanges
    ) => Promise<ExtractedApprovisionnement>
    pays: readonly Pays[]
    onCreateEntreprise: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    importExtractedApprovisionnements: (
        lines: readonly ExtractedApprovisionnement[],
        plan: SelectablePlan['id'],
        source: Attachment['id']
    ) => Promise<Approvisionnement[]>
    onExtractionsChanged: () => void
    onImported: () => void
}

export default function ScreenImportFromDoc({
    plans,
    listAttachments,
    extractions,
    imported,
    getAttachmentUrl,
    extractDocument,
    deleteExtraction,
    updateExtractedApprovisionnement,
    pays,
    onCreateEntreprise,
    findEntrepriseBySiret,
    importExtractedApprovisionnements,
    onExtractionsChanged,
    onImported,
    ...referentiels
}: ScreenImportFromDocProps) {
    const [tab, setTab] = useState<Tab>('selection')
    const [planId, setPlanId] = useState<SelectablePlan['id'] | null>(null)
    const [selectedId, setSelectedId] = useState<Attachment['id'] | null>(null)
    const [extraction, setExtraction] = useState<ExtractionRequest | null>(null)
    const [extracted, setExtracted] = useState<ExtractedStep | null>(null)
    const [reextracting, setReextracting] = useState(false)
    const [shownAlert, setShownAlert] = useState<AlertMessage | null>(null)
    const [documents, setDocuments] = useState<PlanDocuments | null>(null)

    const plan = plans.find(({ id }) => id === planId)
    const planAttachments =
        documents?.status === 'loaded' ? documents.attachments : []
    const selected = planAttachments.find(({ id }) => id === selectedId)
    const alreadyExtracted =
        selected !== undefined &&
        (extractions.get(selected.id)?.lineCount ?? 0) > 0

    function closeSteps() {
        setExtraction(null)
        setExtracted(null)
    }

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        setSelectedId(null)
        setShownAlert(null)
        closeSteps()

        const settle = (settled: PlanDocuments) =>
            setDocuments((previous) =>
                previous?.plan === id ? settled : previous
            )
        setDocuments({ plan: id, status: 'loading' })
        listAttachments(id).then(
            (attachments) =>
                settle({ plan: id, status: 'loaded', attachments }),
            () => settle({ plan: id, status: 'failed' })
        )
    }

    function selectDocument(id: Attachment['id']) {
        setSelectedId(id)
        closeSteps()
    }

    function extract(resumed: boolean) {
        setShownAlert(null)
        setExtracted(null)
        setExtraction((previous) => ({
            run: (previous?.run ?? -1) + 1,
            resumed,
        }))
        setTab('extraction')
    }

    function showImported(alert: AlertMessage) {
        onExtractionsChanged()
        onImported()
        setShownAlert(alert)
        closeSteps()
        setTab('selection')
    }

    async function importLines(
        attachment: Attachment,
        lines: readonly ExtractedApprovisionnement[]
    ) {
        if (!plan) return

        const created = (count: number, participle: string) =>
            `${plural(count, 'approvisionnement')} ${participle}${count > 1 ? 's' : ''}`

        try {
            const approvisionnements = await importExtractedApprovisionnements(
                lines,
                plan.id,
                attachment.id
            )
            showImported({
                severity: 'success',
                text: `${created(approvisionnements.length, 'importé')} depuis ${plural(lines.length, 'ligne')} du document.`,
            })
        } catch (error) {
            if (error instanceof ExtractedLinesNotDeletedError) {
                showImported({
                    severity: 'warning',
                    text: `${created(error.created.length, 'créé')}, mais les lignes du document n'ont pas pu être retirées des lignes à vérifier. Ne les importez pas une seconde fois : relancez l'extraction du document.`,
                })
                return
            }
            if (error instanceof ApprovisionnementsNotCreatedError)
                throw new Error(
                    "L'import a échoué. Aucun approvisionnement n'a été créé. Réessayez."
                )

            throw error
        }
    }

    function replaceLine(updated: ExtractedApprovisionnement) {
        setExtracted(
            (previous) =>
                previous && {
                    ...previous,
                    document: {
                        ...previous.document,
                        lines: previous.document.lines.map((candidate) =>
                            candidate.id === updated.id ? updated : candidate
                        ),
                    },
                }
        )
        onExtractionsChanged()
    }

    async function updateLine(
        line: ExtractedApprovisionnement,
        changes: ExtractedLineChanges
    ) {
        replaceLine(await updateExtractedApprovisionnement(line, changes))
    }

    return (
        <>
            <Tabs
                label="Étapes de l'import"
                currentId={tab}
                onSelect={(id) => setTab(id as Tab)}
                items={[
                    {
                        id: 'selection',
                        label: '1. Sélection du document',
                        content: (
                            <div className="screen-import">
                                <div className="screen-import__search">
                                    <Combobox
                                        label="Plan d'approvisionnement"
                                        hint="Recherche sur le nom du plan"
                                        placeholder="Ex. chaufferie Tulle"
                                        options={plans.map(({ id, nom }) => ({
                                            value: id,
                                            label: nom,
                                        }))}
                                        value={planId}
                                        onChange={(id) => {
                                            if (id !== null) selectPlan(id)
                                        }}
                                    />
                                </div>

                                {plan ? (
                                    <>
                                        <PlanHeader plan={plan} />
                                        {shownAlert && (
                                            <Alert
                                                severity={shownAlert.severity}
                                                size="sm"
                                            >
                                                {shownAlert.text}
                                            </Alert>
                                        )}
                                        {documents?.status === 'loading' && (
                                            <p className="fr-text--sm fr-m-0 screen-import__mention">
                                                Chargement des pièces jointes…
                                            </p>
                                        )}
                                        {documents?.status === 'failed' && (
                                            <Alert severity="error" size="sm">
                                                Les pièces jointes du plan
                                                n&apos;ont pas pu être chargées.
                                                Choisissez de nouveau le plan
                                                pour réessayer.
                                            </Alert>
                                        )}
                                        {documents?.status === 'loaded' && (
                                            <>
                                                <DocumentPicker
                                                    attachments={
                                                        planAttachments
                                                    }
                                                    extractions={extractions}
                                                    imported={imported}
                                                    selectedId={selectedId}
                                                    onSelect={selectDocument}
                                                />
                                                <div className="screen-import__footer">
                                                    <p className="fr-text--sm fr-m-0 screen-import__mention">
                                                        {selected
                                                            ? `Document sélectionné : ${selected.name}`
                                                            : 'Sélectionnez le document BCIB/BCIAT.'}
                                                    </p>
                                                    {alreadyExtracted && (
                                                        <button
                                                            type="button"
                                                            className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-refresh-line"
                                                            onClick={() =>
                                                                setReextracting(
                                                                    true
                                                                )
                                                            }
                                                        >
                                                            Relancer
                                                            l&apos;extraction
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="fr-btn fr-btn--icon-right fr-icon-arrow-right-line"
                                                        disabled={!selected}
                                                        onClick={() =>
                                                            extract(
                                                                alreadyExtracted
                                                            )
                                                        }
                                                    >
                                                        {alreadyExtracted
                                                            ? 'Reprendre la vérification'
                                                            : 'Extraire les données'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <p className="fr-text--sm fr-m-0 screen-import__empty">
                                        Choisissez un plan pour afficher ses
                                        pièces jointes.
                                    </p>
                                )}
                            </div>
                        ),
                    },
                    {
                        id: 'extraction',
                        label: '2. Extraction',
                        disabled: extraction === null,
                        content: extraction && selected && (
                            <div className="screen-import">
                                <DocumentContext
                                    attachment={selected}
                                    getAttachmentUrl={getAttachmentUrl}
                                />
                                <Extraction
                                    key={extraction.run}
                                    extract={() => extractDocument(selected)}
                                    onExtracted={(document) => {
                                        setExtracted({
                                            document,
                                            resumed: extraction.resumed,
                                        })
                                        setTab('verification')
                                        onExtractionsChanged()
                                    }}
                                    onChooseAnother={() => setTab('selection')}
                                />
                            </div>
                        ),
                    },
                    {
                        id: 'verification',
                        label: '3. Vérification et import',
                        disabled: extracted === null,
                        content: extracted && selected && (
                            <Verification
                                {...referentiels}
                                attachment={selected}
                                lines={extracted.document.lines}
                                date={extracted.document.date}
                                resumed={extracted.resumed}
                                pays={pays}
                                getAttachmentUrl={getAttachmentUrl}
                                onUpdateLine={updateLine}
                                onReextract={() => setReextracting(true)}
                                onImport={(lines) =>
                                    importLines(selected, lines)
                                }
                                onCreateEntreprise={onCreateEntreprise}
                                findEntrepriseBySiret={findEntrepriseBySiret}
                            />
                        ),
                    },
                ]}
            />

            {reextracting && selected && (
                <ReextractModal
                    attachment={selected}
                    onConfirm={async () => {
                        await deleteExtraction(selected)
                        setReextracting(false)
                        onExtractionsChanged()
                        extract(false)
                    }}
                    onClose={() => setReextracting(false)}
                />
            )}
        </>
    )
}
