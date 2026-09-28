import './Verification.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'

import { useState } from 'react'
import Badge from '@shared/react/components/Badge'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import Modal from '@shared/react/components/Modal'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type {
    ExtractedLineChanges,
    StoredExtractedLine,
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
import ImportActions from './ImportActions'
import { toApprovisionnements } from '../../import-line'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'

const DATE = new Intl.DateTimeFormat('fr-FR')

const TONNAGE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const DATA_COLUMNS: readonly Column<ExtractedLine>[] = [
    {
        id: 'excel-row',
        header: 'Ligne de la feuille Fournisseur',
        render: (line) => (
            <span className="verification__mention">{line.read.excelRow}</span>
        ),
    },
    {
        id: 'supplier',
        header: 'Fournisseur',
        render: (line) => line.read.supplier,
    },
    {
        id: 'resource',
        header: 'Sous catégorie de combustible',
        render: (line) => line.read.resource,
    },
    {
        id: 'tonnage',
        header: 'Tonnage / an',
        render: (line) => (
            <span className="verification__tonnage">
                {TONNAGE.format(line.read.tonnage)} t
            </span>
        ),
    },
    {
        id: 'provenance',
        header: 'Répartition par provenance',
        render: (line) => line.read.rawProvenance,
    },
    {
        id: 'additionalData',
        header: 'Données additionnelles',
        render: (line) => line.read.additionalData,
    },
]

export type VerificationProps = {
    plan: SelectablePlan
    attachment: Attachment
    lines: readonly StoredExtractedLine[]
    // When the document was extracted.
    date: Date
    entreprises: readonly Entreprise[]
    ressources: readonly Ressource[]
    departementsByRegion: readonly DepartementsByRegion[]
    pays: readonly Pays[]
    onUpdateLine: (
        id: StoredExtractedLine['id'],
        changes: ExtractedLineChanges
    ) => Promise<void>
    onImportLine: (
        approvisionnements: readonly Approvisionnement[],
        line: StoredExtractedLine
    ) => Promise<void>
}

export default function Verification({
    plan,
    attachment,
    lines,
    date,
    entreprises,
    ressources,
    departementsByRegion,
    pays,
    onUpdateLine,
    onImportLine,
}: VerificationProps) {
    const [reviewedLineId, setReviewedLineId] = useState<
        StoredExtractedLine['id'] | null
    >(null)
    const reviewedLine = lines.find(({ id }) => id === reviewedLineId) ?? null
    const approvisionnements = reviewedLine
        ? toApprovisionnements(reviewedLine, plan.id, attachment.id)
        : []

    const columns: readonly Column<StoredExtractedLine>[] = [
        {
            id: 'action',
            header: 'Action',
            render: (line) =>
                line.state === 'Importés' ? (
                    <Badge size="sm" status="success">
                        Importée
                    </Badge>
                ) : (
                    <button
                        type="button"
                        className="fr-btn fr-btn--secondary fr-btn--sm verification__action"
                        onClick={() => setReviewedLineId(line.id)}
                    >
                        Vérifier
                        <span className="fr-sr-only">
                            {' '}
                            la ligne {line.read.excelRow}
                        </span>
                    </button>
                ),
        },
        ...DATA_COLUMNS,
    ]

    return (
        <div className="verification">
            <ImportContext plan={plan} attachment={attachment}>
                <Badge size="sm" status="success">
                    {lines.length} lignes extraites le {DATE.format(date)}
                </Badge>
            </ImportContext>

            <DataTable
                caption="Lignes extraites"
                rows={lines}
                columns={columns}
                bordered
                multiLine
            />

            <Modal
                open={reviewedLine !== null}
                onClose={() => setReviewedLineId(null)}
                title={`Ligne ${reviewedLine?.read.excelRow ?? ''}`}
                size="lg"
                actions={
                    reviewedLine && (
                        <ImportActions
                            key={reviewedLine.id}
                            approvisionnementCount={approvisionnements.length}
                            onCancel={() => setReviewedLineId(null)}
                            onImport={async () => {
                                await onImportLine(
                                    approvisionnements,
                                    reviewedLine
                                )
                                setReviewedLineId(null)
                            }}
                        />
                    )
                }
            >
                {reviewedLine && (
                    <div className="review">
                        <DocumentData line={reviewedLine} />
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
                        />
                    </div>
                )}
            </Modal>
        </div>
    )
}
