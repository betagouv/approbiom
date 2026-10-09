import './Verification.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'
import Badge from '@shared/react/components/Badge'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import type { ExtractedLineChanges } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type { Referentiels } from '../../../referentiels'
import { FOURNISSEUR_NOT_GIVEN } from '../../../constant'
import { formatExtractedAt } from '../../../format-extracted-at'
import DocumentContext from '../DocumentContext'
import DistributionList from './DistributionList'
import ImportModal from './ImportModal'
import ReviewModal from './ReviewModal'
import { distributionSummary, formatPercentage } from './extracted-line'
import {
    countVerified,
    distributionTotal,
    isNot100,
    toApprovisionnements,
    type ExtractedApprovisionnement,
} from '@shared/core/domain/entities/extracted-approvisionnement'

const plural = (count: number, word: string) =>
    `${count} ${word}${count > 1 ? 's' : ''}`

export type VerificationProps = Referentiels & {
    attachment: Attachment
    lines: readonly ExtractedApprovisionnement[]
    date: Date
    resumed: boolean
    pays: readonly Pays[]
    getAttachmentUrl: (id: Attachment['id']) => Promise<string>
    onUpdateLine: (
        line: ExtractedApprovisionnement,
        changes: ExtractedLineChanges
    ) => Promise<void>
    onReextract: () => void
    onImport: (lines: readonly ExtractedApprovisionnement[]) => Promise<void>
    onCreateEntreprise: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    onCreatePays: (pays: Pays) => Promise<void>
}

export default function Verification({
    attachment,
    lines,
    date,
    resumed,
    pays,
    getAttachmentUrl,
    onUpdateLine,
    onReextract,
    onImport,
    onCreateEntreprise,
    findEntrepriseBySiret,
    onCreatePays,
    ...referentiels
}: VerificationProps) {
    const [reviewedId, setReviewedId] = useState<
        ExtractedApprovisionnement['id'] | null
    >(null)
    const reviewed = lines.find(({ id }) => id === reviewedId)
    const [confirmingImport, setConfirmingImport] = useState(false)

    const departementLabels = new Map(
        referentiels.departementsByRegion.flatMap(({ departements }) =>
            departements.map(({ dep, libelle }) => [dep, `${libelle} (${dep})`])
        )
    )
    const verifiedCount = countVerified(lines)
    const canImport = lines.length > 0 && verifiedCount === lines.length
    const approvisionnementCount = lines.flatMap((line) =>
        toApprovisionnements(line, 0, attachment.id)
    ).length

    const columns: readonly Column<ExtractedApprovisionnement>[] = [
        {
            id: 'controle',
            header: 'Contrôle',
            render: ({ controle }) =>
                controle === VERIFIEE ? (
                    <Badge size="sm" status="success">
                        {VERIFIEE}
                    </Badge>
                ) : (
                    <Badge size="sm">{NON_VERIFIEE}</Badge>
                ),
        },
        {
            id: 'ligne',
            header: 'Ligne',
            render: ({ read }) => (
                <span className="verification__mention">{read.excelRow}</span>
            ),
        },
        {
            id: 'fournisseur',
            header: 'Fournisseur',
            render: ({ derived }) =>
                derived.matchedFournisseur?.denomination ?? (
                    <span className="verification__mention">
                        {FOURNISSEUR_NOT_GIVEN}
                    </span>
                ),
        },
        {
            id: 'ressource',
            header: 'Ressource',
            render: ({ derived }) =>
                derived.matchedRessource ? (
                    `${derived.matchedRessource.code} · ${derived.matchedRessource.title}`
                ) : (
                    <span className="verification__mention">Aucune</span>
                ),
        },
        {
            id: 'repartition',
            header: 'Répartition par provenance',
            render: (line) => (
                <span className="verification__repartition">
                    {distributionSummary(line)}
                    {isNot100(line) && (
                        <Badge size="sm" status="warning">
                            Total {formatPercentage(distributionTotal(line))} %
                            ≠ 100 %
                        </Badge>
                    )}
                </span>
            ),
        },
        {
            id: 'action',
            header: 'Action',
            render: (line) => (
                <button
                    type="button"
                    className="fr-btn fr-btn--secondary fr-btn--sm verification__action"
                    onClick={() => setReviewedId(line.id)}
                >
                    {line.controle === VERIFIEE ? 'Voir' : 'Vérifier'}
                    <span className="fr-sr-only">
                        {' '}
                        la ligne {line.read.excelRow}
                    </span>
                </button>
            ),
        },
    ]

    return (
        <div className="verification">
            <DocumentContext
                attachment={attachment}
                getAttachmentUrl={getAttachmentUrl}
            >
                <Badge size="sm" status="success">
                    {plural(lines.length, 'ligne')} extraite
                    {lines.length > 1 ? 's' : ''} le {formatExtractedAt(date)}
                </Badge>
                <button
                    type="button"
                    className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-left fr-icon-refresh-line verification__reextract"
                    onClick={onReextract}
                >
                    Relancer l&apos;extraction
                </button>
            </DocumentContext>

            {resumed && (
                <p className="fr-text--sm fr-m-0 verification__mention verification__resumed">
                    <span
                        className="fr-icon-time-line fr-icon--sm"
                        aria-hidden="true"
                    />
                    Reprise de l&apos;extraction du {formatExtractedAt(date)} ·{' '}
                    {verifiedCount}/{lines.length} lignes déjà vérifiées
                </p>
            )}

            <div className="verification__head">
                <h3 className="fr-h5 fr-m-0">Lignes extraites</h3>
                <p className="fr-text--sm fr-m-0 verification__mention">
                    {verifiedCount} sur {lines.length} vérifiées
                </p>
                {canImport && (
                    <button
                        type="button"
                        className="fr-btn fr-btn--icon-left fr-icon-download-line verification__import"
                        onClick={() => setConfirmingImport(true)}
                    >
                        {lines.length > 1
                            ? `Importer les ${lines.length} lignes vérifiées`
                            : 'Importer la ligne vérifiée'}
                    </button>
                )}
                {verifiedCount < lines.length && (
                    <p className="fr-text--sm fr-m-0 verification__mention verification__hint">
                        <span
                            className="fr-icon-info-line fr-icon--sm"
                            aria-hidden="true"
                        />
                        Vérifiez toutes les lignes pour pouvoir les importer (
                        {verifiedCount}/{lines.length}).
                    </p>
                )}
            </div>

            <DataTable
                caption="Lignes extraites"
                hideCaption
                bordered
                multiLine
                rows={lines}
                columns={columns}
                expandable={{
                    columnId: 'repartition',
                    render: (line) => (
                        <DistributionList
                            line={line}
                            departementLabels={departementLabels}
                        />
                    ),
                }}
            />

            {confirmingImport && (
                <ImportModal
                    lineCount={lines.length}
                    approvisionnementCount={approvisionnementCount}
                    onConfirm={() => onImport(lines)}
                    onClose={() => setConfirmingImport(false)}
                />
            )}
            {reviewed && (
                <ReviewModal
                    key={reviewed.id}
                    {...referentiels}
                    line={reviewed}
                    pays={pays}
                    onChange={(changes) => onUpdateLine(reviewed, changes)}
                    onVerify={async () => {
                        await onUpdateLine(reviewed, { controle: VERIFIEE })
                        setReviewedId(null)
                    }}
                    onClose={() => setReviewedId(null)}
                    onCreateEntreprise={onCreateEntreprise}
                    findEntrepriseBySiret={findEntrepriseBySiret}
                    onCreatePays={onCreatePays}
                />
            )}
        </div>
    )
}
