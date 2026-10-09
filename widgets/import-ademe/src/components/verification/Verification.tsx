import './Verification.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'

import { useRef, useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Badge from '@shared/react/components/Badge'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import Modal from '@shared/react/components/Modal'
import type {
    ExtractedLineChanges,
    ExtractedApprovisionnement,
} from '../../extracted-approvisionnement-port'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import type { DepartementsByRegion } from '@shared/core/application/ports/referentiel-geo'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { SelectablePlan } from '../selection'
import ImportContext from '../import-context'
import DocumentData from './DocumentData'
import FoundData from './FoundData'
import ImportedData from './ImportedData'
import { FOURNISSEUR_NOT_GIVEN } from '../../constant'
import DistributionList, { departementLabelsOf } from './DistributionList'
import ImportActions from './ImportActions'
import { toApprovisionnements } from '../../import-line'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { SiretLookup } from '../../find-entreprise-by-siret'
import { formatExtractedAt } from '../../format-extracted-at'
import { VERIFIEE } from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type { ExtractedLine } from '@shared/core/domain/entities/extracted-approvisionnement'

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const plural = (count: number, word: string) =>
    `${count} ${word}${count > 1 ? 's' : ''}`

function provenanceSummary(line: ExtractedLine): string {
    const { distribution } = line.derived.parsedProvenance
    if (distribution.length === 0) return 'Aucune provenance'

    const total = distribution.reduce(
        (sum, { percentage }) => sum + percentage,
        0
    )

    return `${plural(distribution.length, 'provenance')} · ${NUMBER.format(total)} %`
}

export type VerificationProps = {
    plan: SelectablePlan
    attachment: Attachment
    getAttachmentUrl: (id: Attachment['id']) => Promise<string>
    lines: readonly ExtractedApprovisionnement[]
    // When the document was extracted.
    date: Date
    entreprises: readonly Entreprise[]
    ressources: readonly Ressource[]
    departementsByRegion: readonly DepartementsByRegion[]
    pays: readonly Pays[]
    onUpdateLine: (
        id: ExtractedApprovisionnement['id'],
        changes: ExtractedLineChanges
    ) => Promise<void>
    onImportLine: (
        approvisionnements: readonly Omit<Approvisionnement, 'id'>[]
    ) => Promise<void>
    onCreateFournisseur: (entreprise: Entreprise) => Promise<void>
    onCreatePays: (pays: Pays) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
}

export default function Verification({
    plan,
    attachment,
    getAttachmentUrl,
    lines,
    date,
    entreprises,
    ressources,
    departementsByRegion,
    pays,
    onUpdateLine,
    onImportLine,
    onCreateFournisseur,
    onCreatePays,
    findEntrepriseBySiret,
}: VerificationProps) {
    const [reviewedLineId, setReviewedLineId] = useState<
        ExtractedApprovisionnement['id'] | null
    >(null)
    const reviewedLine = lines.find(({ id }) => id === reviewedLineId) ?? null
    const readOnly = reviewedLine?.controle === VERIFIEE
    const approvisionnements = reviewedLine
        ? toApprovisionnements(reviewedLine, plan.id, attachment.id)
        : []
    const [lastImport, setLastImport] = useState<{
        excelRow: number
        count: number
    } | null>(null)
    const successRef = useRef<HTMLDivElement>(null)

    const departementLabels = departementLabelsOf(departementsByRegion)

    function review(line: ExtractedApprovisionnement) {
        setLastImport(null)
        setReviewedLineId(line.id)
    }

    async function importReviewedLine(line: ExtractedApprovisionnement) {
        await onImportLine(approvisionnements)
        setReviewedLineId(null)
        setLastImport({
            excelRow: line.read.excelRow,
            count: approvisionnements.length,
        })
        // The line's button is gone once imported: the focus goes to the
        // message instead.
        requestAnimationFrame(() => successRef.current?.focus())
    }

    const actionButton = (line: ExtractedApprovisionnement, label: string) => (
        <button
            type="button"
            className="fr-btn fr-btn--secondary fr-btn--sm verification__action"
            onClick={() => review(line)}
        >
            {label}
            <span className="fr-sr-only"> la ligne {line.read.excelRow}</span>
        </button>
    )

    const columns: readonly Column<ExtractedApprovisionnement>[] = [
        {
            id: 'state',
            header: 'Action',
            render: (line) => (
                <div className="verification__state">
                    {line.controle === VERIFIEE ? (
                        <>{actionButton(line, 'Voir')}</>
                    ) : (
                        <>{actionButton(line, 'Modifier et importer')}</>
                    )}
                </div>
            ),
        },
        {
            id: 'state',
            header: 'État',
            render: (line) => (
                <div className="verification__state">
                    {line.controle === VERIFIEE ? (
                        <Badge size="sm" status="success">
                            Déjà importée
                        </Badge>
                    ) : (
                        <Badge size="sm">Non importée</Badge>
                    )}
                </div>
            ),
        },
        {
            id: 'excel-row',
            header: 'Ligne',
            render: (line) => (
                <span className="verification__mention">
                    {line.read.excelRow}
                </span>
            ),
        },
        {
            id: 'fournisseur',
            header: 'Fournisseur',
            render: ({ derived: { matchedFournisseur } }) =>
                !matchedFournisseur ? (
                    <span className="verification__mention">
                        {FOURNISSEUR_NOT_GIVEN}
                    </span>
                ) : (
                    (matchedFournisseur?.denomination ?? (
                        <span className="verification__mention">Aucun</span>
                    ))
                ),
        },
        {
            id: 'ressource',
            header: 'Ressource',
            render: (line) =>
                line.derived.matchedRessource?.description ?? (
                    <span className="verification__mention">Aucune</span>
                ),
        },
        {
            id: 'provenance',
            header: 'Répartition par provenance',
            render: provenanceSummary,
        },
    ]

    return (
        <div className="verification">
            <ImportContext
                plan={plan}
                attachment={attachment}
                getAttachmentUrl={getAttachmentUrl}
            >
                <Badge size="sm" status="success">
                    {plural(lines.length, 'ligne')} extraite
                    {lines.length > 1 ? 's' : ''} le {formatExtractedAt(date)}
                </Badge>
            </ImportContext>

            {lastImport && (
                <div ref={successRef} tabIndex={-1}>
                    <Alert severity="success">
                        Ligne {lastImport.excelRow} importée :{' '}
                        {plural(lastImport.count, 'approvisionnement')} créé
                        {lastImport.count > 1 ? 's' : ''} dans
                        Approvisionnement.
                    </Alert>
                </div>
            )}

            <DataTable
                caption="Lignes extraites"
                rows={lines}
                columns={columns}
                bordered
                multiLine
                expandable={{
                    columnId: 'provenance',
                    render: (line) => (
                        <DistributionList
                            line={line}
                            departementLabels={departementLabels}
                        />
                    ),
                }}
            />

            <Modal
                open={reviewedLine !== null}
                onClose={() => setReviewedLineId(null)}
                title={`Ligne ${reviewedLine?.read.excelRow ?? ''}`}
                size="lg"
                actions={
                    reviewedLine &&
                    !readOnly && (
                        <ImportActions
                            key={reviewedLine.id}
                            approvisionnementCount={approvisionnements.length}
                            onCancel={() => setReviewedLineId(null)}
                            onImport={() => importReviewedLine(reviewedLine)}
                        />
                    )
                }
            >
                {reviewedLine && (
                    <div className="review">
                        <DocumentData line={reviewedLine} />
                        {readOnly ? (
                            <ImportedData
                                line={reviewedLine}
                                departementLabels={departementLabels}
                            />
                        ) : (
                            <FoundData
                                key={reviewedLine.read.excelRow}
                                line={reviewedLine}
                                entreprises={entreprises}
                                ressources={ressources}
                                departementsByRegion={departementsByRegion}
                                pays={pays}
                                onUpdate={(changes) =>
                                    onUpdateLine(reviewedLine.id, changes)
                                }
                                onCreateFournisseur={onCreateFournisseur}
                                onCreatePays={onCreatePays}
                                findEntrepriseBySiret={findEntrepriseBySiret}
                            />
                        )}
                    </div>
                )}
            </Modal>
        </div>
    )
}
