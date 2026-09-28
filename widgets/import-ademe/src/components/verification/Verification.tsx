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

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

function provenanceCount(line: ExtractedLine): string {
    const { length } = line.derived.parsedProvenance.distribution
    if (length === 0) return 'Aucune provenance'

    return length === 1 ? '1 provenance' : `${length} provenances`
}

export type VerificationProps = {
    plan: SelectablePlan
    attachment: Attachment
    getAttachmentUrl: (id: Attachment['id']) => Promise<string>
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
        approvisionnements: readonly Approvisionnement[]
    ) => Promise<void>
    onCreateFournisseur: (entreprise: Entreprise) => Promise<void>
    onCreatePays: (pays: Pays) => Promise<void>
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
}: VerificationProps) {
    const [reviewedLineId, setReviewedLineId] = useState<
        StoredExtractedLine['id'] | null
    >(null)
    const reviewedLine = lines.find(({ id }) => id === reviewedLineId) ?? null
    const approvisionnements = reviewedLine
        ? toApprovisionnements(reviewedLine, plan.id, attachment.id)
        : []

    const departementLabels = new Map(
        departementsByRegion.flatMap(({ departements }) =>
            departements.map(({ dep, libelle }) => [dep, `${libelle} (${dep})`])
        )
    )

    const columns: readonly Column<StoredExtractedLine>[] = [
        {
            id: 'state',
            header: 'État',
            render: (line) =>
                line.state === 'Importés' ? (
                    <Badge size="sm" status="success">
                        Importée
                    </Badge>
                ) : (
                    <div className="verification__state">
                        <Badge size="sm">Pas importée</Badge>
                        <button
                            type="button"
                            className="fr-btn fr-btn--secondary fr-btn--sm verification__action"
                            onClick={() => setReviewedLineId(line.id)}
                        >
                            Modifier
                            <span className="fr-sr-only">
                                {' '}
                                la ligne {line.read.excelRow}
                            </span>
                        </button>
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
            render: (line) =>
                line.derived.matchedFournisseur?.denomination ?? (
                    <span className="verification__mention">Aucun</span>
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
            render: provenanceCount,
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
                    {lines.length} lignes extraites le {DATE.format(date)}
                </Badge>
            </ImportContext>

            <DataTable
                caption="Lignes extraites"
                rows={lines}
                columns={columns}
                bordered
                multiLine
                expandable={{
                    columnId: 'provenance',
                    render: (line) =>
                        line.derived.parsedProvenance.distribution.length ===
                        0 ? (
                            <p className="fr-m-0 verification__mention">
                                Aucune provenance trouvée.
                            </p>
                        ) : (
                            <ul className="verification__distribution">
                                {line.derived.parsedProvenance.distribution.map(
                                    (
                                        { source, provenance, percentage },
                                        index
                                    ) => (
                                        <li key={index}>
                                            {source === 'Pays étranger'
                                                ? provenance
                                                : (departementLabels.get(
                                                      provenance
                                                  ) ?? provenance)}{' '}
                                            : {NUMBER.format(percentage)} % ·{' '}
                                            {NUMBER.format(
                                                (line.read.tonnage *
                                                    percentage) /
                                                    100
                                            )}{' '}
                                            tonnes de matière verte / an
                                        </li>
                                    )
                                )}
                            </ul>
                        ),
                }}
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
                                await onImportLine(approvisionnements)
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
                            onCreateFournisseur={onCreateFournisseur}
                            onCreatePays={onCreatePays}
                        />
                    </div>
                )}
            </Modal>
        </div>
    )
}
