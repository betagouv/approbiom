import './Verification.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'

import { useState } from 'react'
import Badge from '@shared/react/components/Badge'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import Modal from '@shared/react/components/Modal'
import type { ImportedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { SelectablePlan } from '../selection'
import ImportContext from '../import-context'
import DocumentData from './DocumentData'
import FoundData from './FoundData'

const DATE = new Intl.DateTimeFormat('fr-FR')

const TONNAGE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const DATA_COLUMNS: readonly Column<ImportedLines>[] = [
    {
        id: 'excel-row',
        header: 'Ligne de la feuille Fournisseur',
        render: (line) => (
            <span className="verification__mention">{line.excelRow}</span>
        ),
    },
    {
        id: 'supplier',
        header: 'Fournisseur',
        render: (line) => line.supplier,
    },
    {
        id: 'resource',
        header: 'Sous catégorie de combustible',
        render: (line) => line.resource,
    },
    {
        id: 'tonnage',
        header: 'Tonnage / an',
        render: (line) => (
            <span className="verification__tonnage">
                {TONNAGE.format(line.tonnage)} t
            </span>
        ),
    },
    {
        id: 'provenance',
        header: 'Répartition par provenance',
        render: (line) => line.rawProvenance,
    },
    {
        id: 'additionalData',
        header: 'Données additionnelles',
        render: (line) => line.additionalData,
    },
]

export type VerificationProps = {
    plan: SelectablePlan
    attachment: Attachment
    lines: readonly ImportedLines[]
    // When the document was extracted.
    date: Date
}

export default function Verification({
    plan,
    attachment,
    lines,
    date,
}: VerificationProps) {
    // The line being reviewed in the modal, if any.
    const [reviewedLine, setReviewedLine] = useState<ImportedLines | null>(null)

    const columns: readonly Column<ImportedLines>[] = [
        {
            id: 'action',
            header: 'Action',
            render: (line) => (
                <button
                    type="button"
                    className="fr-btn fr-btn--secondary fr-btn--sm verification__action"
                    onClick={() => setReviewedLine(line)}
                >
                    Vérifier et importer
                    <span className="fr-sr-only">
                        {' '}
                        la ligne {line.excelRow}
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
                title={`Ligne ${reviewedLine?.excelRow ?? ''}`}
                size="lg"
            >
                {reviewedLine && (
                    <div className="review">
                        <DocumentData line={reviewedLine} />
                        <FoundData line={reviewedLine} />
                    </div>
                )}
            </Modal>
        </div>
    )
}
