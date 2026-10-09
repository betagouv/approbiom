import './ScreenImportFromDoc.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'
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
import PlanHeader from '../PlanHeader'
import type { SelectablePlan } from '../ScreenSelectPlan'
import type { AlertMessage } from '../ScreenPlanApprovisionnement'
import DocumentContext from './DocumentContext'
import DocumentPicker from './DocumentPicker'
import Extraction from './Extraction'
import ReextractModal from './ReextractModal'
import Verification from './Verification'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'
import { plural } from '@shared/react/format'

type Step =
    | { name: 'choose' }
    | { name: 'extract'; run: number; resumed: boolean }
    | { name: 'verify'; extracted: ExtractedDocument; resumed: boolean }

export type ScreenImportFromDocProps = Referentiels & {
    plan: SelectablePlan
    attachments: readonly Attachment[]
    extractions: ReadonlyMap<Attachment['id'], ExtractionSummary>
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
    onCreatePays: (pays: Pays) => Promise<void>
    importExtractedApprovisionnements: (
        lines: readonly ExtractedApprovisionnement[],
        source: Attachment['id']
    ) => Promise<Approvisionnement[]>
    onExtractionsChanged: () => void
    onImported: (alert: AlertMessage) => void
    onBack: () => void
    resumedId?: Attachment['id']
}

export default function ScreenImportFromDoc({
    plan,
    attachments,
    extractions,
    getAttachmentUrl,
    extractDocument,
    deleteExtraction,
    updateExtractedApprovisionnement,
    pays,
    onCreateEntreprise,
    findEntrepriseBySiret,
    onCreatePays,
    importExtractedApprovisionnements,
    onExtractionsChanged,
    onImported,
    onBack,
    resumedId,
    ...referentiels
}: ScreenImportFromDocProps) {
    const [step, setStep] = useState<Step>(
        resumedId === undefined
            ? { name: 'choose' }
            : { name: 'extract', run: 0, resumed: true }
    )
    const [selectedId, setSelectedId] = useState<Attachment['id'] | null>(
        resumedId ?? null
    )
    const [reextracting, setReextracting] = useState(false)

    const selected = attachments.find(({ id }) => id === selectedId)
    const alreadyExtracted =
        selected !== undefined &&
        (extractions.get(selected.id)?.lineCount ?? 0) > 0

    const extract = (resumed: boolean) =>
        setStep((previous) => ({
            name: 'extract',
            run: previous.name === 'extract' ? previous.run + 1 : 0,
            resumed,
        }))

    async function importLines(
        attachment: Attachment,
        lines: readonly ExtractedApprovisionnement[]
    ) {
        const created = (count: number, participle: string) =>
            `${plural(count, 'approvisionnement')} ${participle}${count > 1 ? 's' : ''}`

        try {
            const approvisionnements = await importExtractedApprovisionnements(
                lines,
                attachment.id
            )
            onExtractionsChanged()
            onImported({
                severity: 'success',
                text: `${created(approvisionnements.length, 'importé')} depuis ${plural(lines.length, 'ligne')} du document.`,
            })
        } catch (error) {
            if (error instanceof ExtractedLinesNotDeletedError) {
                onExtractionsChanged()
                onImported({
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

    async function updateLine(
        line: ExtractedApprovisionnement,
        changes: ExtractedLineChanges
    ) {
        const updated = await updateExtractedApprovisionnement(line, changes)
        setStep((previous) =>
            previous.name === 'verify'
                ? {
                      ...previous,
                      extracted: {
                          ...previous.extracted,
                          lines: previous.extracted.lines.map((candidate) =>
                              candidate.id === line.id ? updated : candidate
                          ),
                      },
                  }
                : previous
        )
        onExtractionsChanged()
    }

    return (
        <>
            <PlanHeader plan={plan} />

            <div className="screen-import">
                <div>
                    <button
                        type="button"
                        className="fr-link fr-link--sm fr-link--icon-left fr-icon-arrow-left-line"
                        onClick={onBack}
                    >
                        Retour aux approvisionnements du plan
                    </button>
                </div>
                <h2 className="fr-h6 fr-mb-0">
                    Ajouter des approvisionnements depuis un document BCIB/BCIAT
                </h2>

                {step.name === 'choose' && (
                    <>
                        <DocumentPicker
                            attachments={attachments}
                            extractions={extractions}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
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
                                    onClick={() => setReextracting(true)}
                                >
                                    Relancer l&apos;extraction
                                </button>
                            )}
                            <button
                                type="button"
                                className="fr-btn fr-btn--icon-right fr-icon-arrow-right-line"
                                disabled={!selected}
                                onClick={() => extract(alreadyExtracted)}
                            >
                                {alreadyExtracted
                                    ? 'Reprendre la vérification'
                                    : 'Extraire les données'}
                            </button>
                        </div>
                    </>
                )}

                {step.name === 'extract' && selected && (
                    <>
                        <DocumentContext
                            attachment={selected}
                            getAttachmentUrl={getAttachmentUrl}
                        />
                        <Extraction
                            key={step.run}
                            extract={() => extractDocument(selected)}
                            onExtracted={(extracted) => {
                                setStep({
                                    name: 'verify',
                                    extracted,
                                    resumed: step.resumed,
                                })
                                onExtractionsChanged()
                            }}
                            onChooseAnother={() => setStep({ name: 'choose' })}
                        />
                    </>
                )}

                {step.name === 'verify' && selected && (
                    <Verification
                        {...referentiels}
                        attachment={selected}
                        lines={step.extracted.lines}
                        date={step.extracted.date}
                        resumed={step.resumed}
                        pays={pays}
                        getAttachmentUrl={getAttachmentUrl}
                        onUpdateLine={updateLine}
                        onReextract={() => setReextracting(true)}
                        onImport={(lines) => importLines(selected, lines)}
                        onCreateEntreprise={onCreateEntreprise}
                        findEntrepriseBySiret={findEntrepriseBySiret}
                        onCreatePays={onCreatePays}
                    />
                )}
            </div>

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
