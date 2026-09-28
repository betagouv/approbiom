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
import type { SelectablePlan } from '../selection'
import ImportContext from '../import-context'
import DocumentData from './DocumentData'
import FoundData from './FoundData'

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
    onUpdateLine: (
        id: StoredExtractedLine['id'],
        changes: ExtractedLineChanges
    ) => Promise<void>
}

export default function Verification({
    plan,
    attachment,
    lines,
    date,
    entreprises,
    ressources,
    onUpdateLine,
}: VerificationProps) {
    // The line being reviewed in the modal, if any.
    const [reviewedLine, setReviewedLine] =
        useState<StoredExtractedLine | null>(null)

    const columns: readonly Column<StoredExtractedLine>[] = [
        {
            id: 'action',
            header: 'Action',
            render: (line) => (
                <button
                    type="button"
                    className="fr-btn fr-btn--secondary fr-btn--sm verification__action"
                    onClick={() => setReviewedLine(line)}
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
                onClose={() => setReviewedLine(null)}
                title={`Ligne ${reviewedLine?.read.excelRow ?? ''}`}
                size="lg"
            >
                {reviewedLine && (
                    <div className="review">
                        <DocumentData line={reviewedLine} />
                        <FoundData
                            key={reviewedLine.read.excelRow}
                            line={reviewedLine}
                            entreprises={entreprises}
                            ressources={ressources}
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
